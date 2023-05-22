import { parseGlassBlocks, removeGlassComments } from '@glass-lang/glasslib'
import camelcase from 'camelcase'
import * as fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import { parseGlassAST } from '../parse/parseGlassAST.js'
import { parseGlassTopLevelJsxElements } from '../parse/parseGlassTopLevelJsxElements.js'
import { parseJsxAttributes } from '../parse/parseJsxAttributes.js'
import { parseJsxElement } from '../parse/parseJsxElement.js'
import { parseCodeBlock } from '../parse/parseTypescript.js'
import { removeGlassFrontmatter } from '../transform/removeGlassFrontmatter.js'
import { transformDynamicBlocks } from '../transform/transformDynamicBlocks.js'
import { getUseStatePairs } from '../transform/transformSetState.js'
import { getGlassExportName } from './transpileGlass.js'
import { TYPESCRIPT_GLOBALS } from './typescriptGlobals.js'

const extension = 'glass'

/**
 * Takes a .glass document and returns a code file.
 * The directory / folder information is necessary so we can correctly re-write import paths.
 * The language is necessary so we can correctly format the output. Currently only supports 'typescript'.
 */
export function transpileGlassFileNext(
  doc: string,
  {
    workspaceFolder,
    folderPath,
    outputDirectory,
    fileName,
    language,
  }: { workspaceFolder: string; folderPath: string; outputDirectory: string; fileName: string; language: string }
) {
  if (language !== 'typescript' && language !== 'javascript') {
    throw new Error(`${language} not supported yet`)
  }

  const originalDoc = doc

  const toplevelNodes = parseGlassTopLevelJsxElements(originalDoc)

  // first, parse the document blocks to make sure the document is valid
  // this will also tell us if there are any special (e.g. <Code>) blocks that should appear unmodified in the final output
  const blocks = parseGlassBlocks(doc)
  // if (blocks.length === 0) {
  //   throw new Error(`No blocks found in ${fileName}.${extension}, did you mean to add a <Prompt> block?`)
  // }

  const stateNode = toplevelNodes.find(node => node.tagName === 'State')
  let state = {} as any
  if (stateNode) {
    const innerContents = stateNode.children.length
      ? originalDoc.substring(
          stateNode.children[0].position.start.offset,
          stateNode.children[stateNode.children.length - 1].position.end.offset
        )
      : '{}'
    if (innerContents.startsWith('```json') && innerContents.endsWith('```')) {
      state = JSON.parse(innerContents.slice(7, -3).trim())
    } else {
      state = JSON.parse(innerContents)
      //TODO: support other content types
    }
  }

  const codeBlocks = blocks.filter(b => b.tag === 'Code')

  // remove all block comments before any processing happens
  doc = removeGlassComments(doc)
  const functionName = camelcase(fileName)
  const exportName = getGlassExportName(fileName)

  const hasPrompt = toplevelNodes.filter(node => node.tagName === 'Prompt').length > 0
  const isChat = !hasPrompt

  const { imports, interpolationArgs, jsxExpressions, isAsync } = parseGlassAST(doc, {
    workspaceFolder,
    folderPath,
    outputDirectory,
    fileName,
  })

  // all variables inside {} are interpolation variables, including ones like {foo.bar}
  const allInterpolationVars = Object.keys(interpolationArgs)

  const interpolationVarNames = Array.from(new Set<string>(allInterpolationVars.map(arg => arg.split('.')[0])))

  const interpolationVarSet = new Set(interpolationVarNames)

  let argsNode = ''

  let model = isChat ? 'gpt-3.5-turbo' : 'text-davinci-003'

  let onResponse = ''

  // find all the interpolation variables from dynamic code blocks
  for (const jsxNode of toplevelNodes) {
    if (jsxNode.tagName === 'Args') {
      argsNode = originalDoc.substring(jsxNode.position.start.offset, jsxNode.position.end.offset)
    }
    if (jsxNode.tagName === 'Code') {
      // don't strip away codeblocks, yet
      // doc = doc.substring(0, jsxNode.position.start.offset) + doc.substring(jsxNode.position.end.offset)
      continue // ignore all interpolation sequences / requirements in code blocks
    }
    if (jsxNode.tagName === 'State') {
      continue
    }
    if (jsxNode.tagName === 'Chat' || jsxNode.tagName === 'Completion') {
      const modelAttr = jsxNode.attrs.find(a => a.name === 'model')
      // value is either <Chat model="gpt-3.5-turbo" /> or <Chat model={"gpt-4"} />
      // we don't currently support dynamic model values
      model = modelAttr ? modelAttr.stringValue || JSON.parse(modelAttr.expressionValue!) : model

      const onResponseAttr = jsxNode.attrs.find(a => a.name === 'onResponse')
      onResponse = onResponseAttr ? onResponseAttr.expressionValue! : ''
      continue
    }
    // if (builtinTags.has(jsxNode.tagName)) {
    //   continue
    // }
    const jsxString = originalDoc.substring(jsxNode.position.start.offset, jsxNode.position.end.offset)
    const parsedJsx = parseJsxElement(jsxString)
    const attrs = parseJsxAttributes(jsxString)
    const itemKey = attrs['item']

    if (itemKey) {
      interpolationVarSet.delete(itemKey) // sketchy removal, could cause problems if we have another variable defined with same name but fine for now
    }

    for (const s of parsedJsx.undeclaredVariables) {
      if (s === itemKey) {
        // <For each={messages} item="m"> puts "m" in scope
        continue
      }
      interpolationVarSet.add(s)
    }
  }

  TYPESCRIPT_GLOBALS.forEach(globalValue =>
    // remove all the globally defined values
    interpolationVarSet.delete(globalValue)
  )

  const parsedCodeBlocks =
    codeBlocks.length === 0
      ? [parseCodeBlock(`${imports.join('\n')}`)]
      : codeBlocks.map(block => parseCodeBlock(`${imports.join('\n')}\n${block.content}`))
  const hasAsyncCodeBlocks = parsedCodeBlocks.filter(block => block.isAsync).length > 0

  for (const block of parsedCodeBlocks) {
    for (const symbol of block.symbolsAddedToScope) {
      interpolationVarSet.delete(symbol)
    }
    for (const symbol of block.importedSymbols) {
      interpolationVarSet.delete(symbol)
    }
    for (const symbol of block.undeclaredValuesNeededInScope) {
      interpolationVarSet.add(symbol)
    }
  }

  const argsOverride = argsNode ? parseJsxAttributes(argsNode) : {}

  const dynamicTransform = transformDynamicBlocks(doc, true)
  doc = dynamicTransform.doc

  const allInterpolationNames = Array.from(interpolationVarSet)

  // if (frontmatterArgs.length === 0 && interpolationVarNames.length > 0) {
  const argsString = allInterpolationNames.map(arg => arg + `: ${argsOverride[arg] || 'string'}`).join(', ')
  let fullArgString = ''
  if (allInterpolationNames.length > 0) {
    fullArgString = language === 'typescript' ? `args: { ${argsString} }` : 'args'
  }
  // }

  // remove frontmatter after parsing the AST
  doc = removeGlassFrontmatter(doc)

  let codeSanitizedDoc = doc
  const codeInterpolationMap: any = { ...dynamicTransform.jsxInterpolations }

  // iterate over all the jsxExpressions (values inside `{ }`) and replace them with a number if they're supposed to be treated like code (values inside `${ }`)

  for (let j = 0; j < jsxExpressions.length; j++) {
    const expr = jsxExpressions[j]

    const codeInterpolation = '${' + expr + '}'
    const indexOfInterpolation = codeSanitizedDoc.indexOf(codeInterpolation)
    if (indexOfInterpolation === -1) {
      continue
    }
    // codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${${j}}`)
    if (expr.trim().startsWith('async')) {
      codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${await (${expr.trim()})()}`)
      // codeInterpolationMap['' + j] = `await (${expr.trim()})()`
    } else if (expr.trim().startsWith('function')) {
      codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${(${expr.trim()})()}`)
      // codeInterpolationMap['' + j] = `(${expr.trim()})()`
    } else {
      codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${${expr.trim()}}`)
      // codeInterpolationMap['' + j] = expr.trim()
    }
  }

  // after interpolating everything, we can unescape `\{ \}` sequences
  // codeSanitizedDoc = unescapeGlass(codeSanitizedDoc)

  let options =
    language === 'typescript'
      ? 'options?: {  openaiKey?: string, progress?: (data: { nextDoc: string; rawResponse?: string }) => void } '
      : 'options'
  if (fullArgString) {
    options = ', ' + options
  }

  // handle undefined options
  const functionArgs =
    language === 'javascript' ? 'opt' : `opt${fullArgString ? '' : '?'}: { ${fullArgString}${options} }`

  const codePairs = codeBlocks.map(b => getUseStatePairs(b.content))
  // join them all together
  const allPairs = codePairs.reduce((acc, val) => ({ ...acc, ...val }), {})
  const context: any = {}
  for (const [k, v] of Object.entries(allPairs)) {
    context[v] = `(val) => GLASS_STATE[${k}] = val`
  }

  const code = `${imports.join('\n')}

export async function ${exportName}(${functionArgs}) {${language === 'javascript' ? '\n  opt = opt || {}' : ''}
  const GLASS_STATE = ${JSON.stringify(state)}
  ${argsString ? `const {${allInterpolationNames.join(',')}} = opt.args` : ''}
  ${codeBlocks.map(b => b.content).join('\n')}
  const GLASS_CONTEXT = {
    ${Object.keys(context)
      .map(k => `"${k}": ${context[k]}`)
      .join(',')}
  }
  const GLASSVAR = {
    ${Object.keys(codeInterpolationMap)
      .map(k => `"${k}": ${codeInterpolationMap[k]}`)
      .join(',')}
  }
  const TEMPLATE = \`${codeSanitizedDoc.replaceAll('`', '\\`')}\`
  return await runGlass('${fileName}', '${model}', TEMPLATE, opt${fullArgString ? '' : '?'}.options)
}`

  const formattedCode = prettier.format(code, {
    parser: 'babel',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
  })
  return {
    code: formattedCode.trim(),
    args: [],
    imports,
    functionName,
    exportName,
    variableNames: allInterpolationNames,
  }
}

/**
 * Takes a path, either to a file or a folder, and transpiles all glass files in that folder, or the file specified.
 */
export function transpileGlassNext(
  workspaceFolder: string,
  fileOrFolderPath: string,
  language: string,
  outputDirectory: string
) {
  const functions = transpileGlassHelper(workspaceFolder, fileOrFolderPath, language, outputDirectory)
  return constructGlassOutputFileNext(functions)
}

export function constructGlassOutputFileNext(functions: ReturnType<typeof transpileGlassHelper>) {
  const glassConstant = `export const Glass = {
    ${functions.map(f => `${f.functionName}: ${f.exportName}`).join(',\n  ')}
  }`
  const functionsString = functions.map(f => f.code).join('\n\n')

  const code = `// THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

  import { runGlass } from '@glass-lang/glasslib'

  ${functionsString}

  ${glassConstant}
  `

  const output = prettier.format(code, {
    parser: 'babel',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
  })

  return output
}

function transpileGlassHelper(
  workspaceFolder: string,
  fileOrFolderPath: string,
  language: string,
  outputDirectory: string
): {
  code: string
  args: {
    name: string
    type: string
    description?: string | undefined
    optional?: boolean | undefined
  }[]
  imports: string[]
  functionName: string
  exportName: string
}[] {
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
    const codegenedResult = transpileGlassFileNext(fileContent, {
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
function recursiveCodegen(workspaceFolder: string, folderPath: string, language: string, outputDirectory: string) {
  const files = fs.readdirSync(folderPath)
  const functions: any = []
  for (const file of files) {
    const filePath = path.join(folderPath, file)
    functions.push(...transpileGlassHelper(workspaceFolder, filePath, language, outputDirectory))
  }
  return functions
}
