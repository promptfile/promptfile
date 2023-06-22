import glasslib from '@glass-lang/glasslib'
import { UnwrapPromise } from '@glass-lang/util'
import camelcase from 'camelcase'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parsePyCode } from '../parse/parsePyCode.js'
import { transformDynamicBlocksPython } from '../transform/transformDynamicBlocksPython.js'
import { transformPythonTestBlock } from '../transform/transformPyTestBlock.js'
import { indentLines } from '../util/indentLines.js'
import { getGlassExportName } from './transpileGlassTypescript.js'

const extension = 'glass'

/**
 * Takes a .glass document and returns a code file.
 * The directory / folder information is necessary so we can correctly re-write import paths.
 * The language is necessary so we can correctly format the output. Currently only supports 'typescript'.
 */
export async function transpileGlassFilePython(
  doc: string,
  {
    workspaceFolder,
    folderPath,
    outputDirectory,
    fileName,
    language,
  }: { workspaceFolder: string; folderPath: string; outputDirectory: string; fileName: string; language: string }
) {
  const originalDoc = doc

  const parsedDocument = glasslib.parseGlassDocument(originalDoc)

  const testContent = parsedDocument
    .filter(t => 'tag' in t && t.tag === 'Test')
    .map(t => (t as any).child.content)
    .join('\n')

  // remove all block comments before any processing happens
  doc = glasslib.removeGlassComments(doc)
  const functionName = camelcase(fileName)
  const exportName = getGlassExportName(fileName)

  // all variables inside {} are interpolation variables, including ones like {foo.bar}
  // const allInterpolationVars = Object.keys(interpolationArgs)

  // const interpolationVarNames = Array.from(new Set<string>(allInterpolationVars.map(arg => arg.split('.')[0])))

  const requestBlocks: { model: string; onResponse?: string }[] = []

  // find all the interpolation variables from dynamic code blocks
  for (const jsxNode of parsedDocument.filter(d => d.type === 'block')) {
    if (jsxNode.tag === 'Test') {
      // don't strip away codeblocks, yet
      // doc = doc.substring(0, jsxNode.position.start.offset) + doc.substring(jsxNode.position.end.offset)
      continue // ignore all interpolation sequences / requirements in code blocks
    }
    if (jsxNode.tag === 'Transcript') {
      continue
    }
    if (jsxNode.tag === 'Request') {
      const modelAttr = jsxNode.attrs!.find(a => a.name === 'model')
      // value is either <Request model="gpt-3.5-turbo" /> or <Request model={"gpt-4"} />
      // we don't currently support dynamic model values
      const model = modelAttr ? modelAttr.stringValue || JSON.parse(modelAttr.expressionValue!) : 'gpt-3.5-turbo'

      const onResponseAttr = jsxNode.attrs!.find(a => a.name === 'onResponse')
      if (onResponseAttr?.expressionValue) {
        requestBlocks.push({ model, onResponse: onResponseAttr.expressionValue })
      } else {
        requestBlocks.push({ model, onResponse: 'None' })
      }
      continue
    }
    // if (builtinTags.has(jsxNode.tagName)) {
    //   continue
    // }
  }

  // remove frontmatter after parsing the AST
  doc = glasslib.removeGlassFrontmatter(doc)

  const toplevelCode = parsedDocument
    .filter(d => d.tag === 'Code')
    .map(d => d.content)
    .join('\n')

  // remove all lines from toplevel code that start with `import `

  const dynamicTransform = transformDynamicBlocksPython(doc)
  doc = dynamicTransform.doc

  // look inside the transformedDoc for any sequence like:
  // ${...} (allowing for whitespace / multiple lines), or
  // !##GLASS-[0-9]+
  //
  // replace all of these with a Python format argument {} and add the
  // corresponding value to the formatArgs array
  const regex = /\$\{(.+?)\}/gs
  let match: RegExpExecArray | null

  let finalDoc = doc
  const formatArgs: string[] = []

  while ((match = regex.exec(doc)) != null) {
    formatArgs.push(match[1])
    finalDoc = finalDoc.replace(match[0], '{}')
  }

  // const codeInterpolationMap: any = { ...dynamicTransform.jsxInterpolations }
  const codeInterpolationMap: any = {}
  for (const key of Object.keys(dynamicTransform.jsxInterpolations)) {
    let interpSequence = dynamicTransform.jsxInterpolations[key]
    for (const nestedKey of Object.keys(dynamicTransform.nestedInterpolations)) {
      // replace all instances of `GLASSVAR[${nestedKey}]` with the corresponding value from the nested interpolation sequences
      const nestedInterpSequence = dynamicTransform.nestedInterpolations[nestedKey]
      interpSequence = interpSequence.replaceAll(`GLASSVAR[${nestedKey}]`, nestedInterpSequence)
    }

    codeInterpolationMap[key] = interpSequence
  }

  // iterate over all the jsxExpressions (values inside `{ }`) and replace them with a number if they're supposed to be treated like code (values inside `${ }`)

  // for (let j = 0; j < jsxExpressions.length; j++) {
  //   const expr = jsxExpressions[j]

  //   const codeInterpolation = '${' + expr + '}'
  //   const indexOfInterpolation = codeSanitizedDoc.indexOf(codeInterpolation)
  //   if (indexOfInterpolation === -1) {
  //     continue
  //   }
  //   // codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${${j}}`)
  //   if (expr.trim().startsWith('async')) {
  //     codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${await (${expr.trim()})()}`)
  //     // codeInterpolationMap['' + j] = `await (${expr.trim()})()`
  //   } else if (expr.trim().startsWith('function')) {
  //     codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${(${expr.trim()})()}`)
  //     // codeInterpolationMap['' + j] = `(${expr.trim()})()`
  //   } else {
  //     codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${${expr.trim()}}`)
  //     // codeInterpolationMap['' + j] = expr.trim()
  //   }
  // }

  // after interpolating everything, we can unescape `\{ \}` sequences
  // codeSanitizedDoc = unescapeGlass(codeSanitizedDoc)

  const undeclaredSymbols = new Set(dynamicTransform.undeclaredSymbols)

  const { symbolsAddedToScope, undeclaredValuesNeededInScope } = await parsePyCode(toplevelCode)
  // parse the code blocks to remove undeclared symbols
  for (const localVar of symbolsAddedToScope) {
    undeclaredSymbols.delete(localVar)
  }
  for (const undeclaredVar of undeclaredValuesNeededInScope) {
    undeclaredSymbols.add(undeclaredVar)
  }

  // if any imports match "import .+ from .+", translate them to "from .+ import .+"
  for (const line of toplevelCode.split('\n')) {
    const match = line.match(/import (.+)/)
    if (match) {
      undeclaredSymbols.delete(match[1])
    }
  }

  const undeclaredVars = Array.from(undeclaredSymbols)
    .map(s => `${s} = opt["args"]["${s}"]`)
    .join('\n')

  let codeStart = ''
  if (undeclaredVars) {
    codeStart = undeclaredVars
  }
  if (toplevelCode) {
    codeStart = (codeStart ? codeStart + '\n' : codeStart) + toplevelCode
  }

  const glassvar =
    Object.keys(codeInterpolationMap).length === 0
      ? 'GLASSVAR = {}'
      : 'GLASSVAR = {\n            ' +
        Object.keys(codeInterpolationMap)
          .map(k => `${k}: ${codeInterpolationMap[k]}`)
          .join(',\n            ') +
        '\n    }'

  const code = `def ${exportName}(interpolationArgs = {}):
${indentLines(await transformPythonTestBlock(testContent), 4)}
${'    '}
    def compile(opt = { "args": {} }):
${indentLines(codeStart.trim(), 8)}
        ${glassvar}
        return {
            "fileName": "${fileName}",
            "requestBlocks": [ ${requestBlocks
              .map(b => `{ "model": "${b.model}", "onResponse": ${b.onResponse} }`)
              .join(', ')} ],
            "state": {},
            "originalDoc": ${JSON.stringify(originalDoc)},
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """${finalDoc}""".format(${formatArgs.join(', ')}),
        }
${'    '}
    testData = get_test_data()
    testData.update(interpolationArgs)
    return json.dumps(compile({ "args": testData }))

`

  return {
    code: code.trim(),
    args: [],
    functionName,
    exportName,
    variableNames: dynamicTransform.undeclaredSymbols,
  }
}

/**
 * Takes a path, either to a file or a folder, and transpiles all glass files in that folder, or the file specified.
 */
export async function transpileGlassPython(
  workspaceFolder: string,
  fileOrFolderPath: string,
  language: string,
  outputDirectory: string
) {
  const functions = await transpileGlassHelper(workspaceFolder, fileOrFolderPath, language, outputDirectory)
  return constructGlassOutputFilePython(functions)
}

export function constructGlassOutputFilePython(functions: UnwrapPromise<ReturnType<typeof transpileGlassHelper>>) {
  const functionsString = functions.map(f => f.code).join('\n\n')

  const code = `# THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

import json

${functionsString}
`

  return code
}

async function transpileGlassHelper(
  workspaceFolder: string,
  fileOrFolderPath: string,
  language: string,
  outputDirectory: string
): Promise<
  {
    code: string
    args: {
      name: string
      type: string
      description?: string | undefined
      optional?: boolean | undefined
    }[]
    functionName: string
    exportName: string
  }[]
> {
  const file = fileOrFolderPath.split('/').slice(-1)[0]
  const folderPath = fileOrFolderPath.split('/').slice(0, -1).join('/')
  if (fs.statSync(fileOrFolderPath).isDirectory()) {
    // Recursively process files in subdirectory
    return recursiveCodegen(workspaceFolder, fileOrFolderPath, language, outputDirectory)
  } else if (path.extname(file) === `.${extension}`) {
    const fileContent = fs.readFileSync(fileOrFolderPath, 'utf8')
    const fileName = path.basename(file, `.${extension}`)

    // const newFileName = `${fileName}.ts` // TODO: allow other languages
    // const newFilePath = path.join(folderPath, newFileName)

    // Transpile the glass file to the target language.
    const codegenedResult = await transpileGlassFilePython(fileContent, {
      workspaceFolder,
      folderPath,
      fileName,
      language,
      outputDirectory,
    })
    if (!codegenedResult) {
      return []
    }
    return [codegenedResult]
    // fs.writeFileSync(newFilePath, code)
  } else {
    // not a glass file
    return []
  }
}
async function recursiveCodegen(
  workspaceFolder: string,
  folderPath: string,
  language: string,
  outputDirectory: string
) {
  const files = fs.readdirSync(folderPath)
  const functions: any = []
  for (const file of files) {
    const filePath = path.join(folderPath, file)
    functions.push(...(await transpileGlassHelper(workspaceFolder, filePath, language, outputDirectory)))
  }
  return functions
}
