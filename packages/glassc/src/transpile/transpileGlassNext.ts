import glasslib from '@glass-lang/glasslib'
import camelcase from 'camelcase'
import * as fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import { parseFrontmatter } from '../parse/parseFrontmatter.js'
import { parseInterpolations } from '../parse/parseInterpolations.js'
import { parseJsxAttributes } from '../parse/parseJsxAttributes.js'
import { parseJsxElement } from '../parse/parseJsxElement.js'
import {
  parseCodeBlock,
  parseCodeBlockUndeclaredSymbols,
  parseTsGlassImports,
  removeImports,
} from '../parse/parseTypescript.js'
import { rewriteImports } from '../transform/rewriteImports.js'
import { transformDynamicBlocks } from '../transform/transformDynamicBlocks.js'
import { getUseStatePairs, transformSetState } from '../transform/transformSetState.js'
import { transformTsTestBlock } from '../transform/transformTsTestBlock.js'
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

  const parsedDocument = glasslib.parseGlassDocument(originalDoc)

  const testContent = parsedDocument
    .filter(t => 'tag' in t && t.tag === 'Test')
    .map(t => (t as any).child.content)
    .join('\n')

  const stateNode = parsedDocument.find(node => 'tag' in node && node.tag === 'State')
  let state = {} as any
  if (stateNode) {
    const innerContents = (stateNode as any).child.content
    if (innerContents.startsWith('```json') && innerContents.endsWith('```')) {
      state = JSON.parse(innerContents.slice(7, -3).trim())
    } else {
      state = JSON.parse(innerContents)
      //TODO: support other content types
    }
  }

  // remove all block comments before any processing happens
  doc = glasslib.removeGlassComments(doc)
  const functionName = camelcase(fileName)
  const exportName = getGlassExportName(fileName)

  const interpolationVarSet = new Set<string>([])

  const dynamicTransform = transformDynamicBlocks(doc, true)
  doc = dynamicTransform.doc

  const codeInterpolationMap: any = { ...dynamicTransform.jsxInterpolations }

  // iterate over all the jsxExpressions (values inside `{ }`) and replace them with a number if they're supposed to be treated like code (values inside `${ }`)
  let codeSanitizedDoc = ''
  for (const node of glasslib.parseGlassDocument(glasslib.removeGlassFrontmatter(doc))) {
    if (node.type === 'code' || node.type === 'frontmatter') {
      codeSanitizedDoc += node.content // or remove frontmatter from code sanitized doc?
      continue
    }

    let content = node.content
    const interpolations = parseInterpolations(content)

    for (const codeInterpolation of interpolations) {
      const expr = codeInterpolation.slice(2, -1)

      for (const s of parseCodeBlockUndeclaredSymbols(expr)) {
        interpolationVarSet.add(s)
      }

      const indexOfInterpolation = content.indexOf(codeInterpolation)
      if (indexOfInterpolation === -1) {
        continue
      }
      if (expr.trim().startsWith('async')) {
        content = content.replace(codeInterpolation, `\${await (${expr.trim()})()}`)
      } else if (expr.trim().startsWith('function')) {
        content = content.replace(codeInterpolation, `\${(${expr.trim()})()}`)
      } else {
        content = content.replace(codeInterpolation, `\${${expr.trim()}}`)
      }
    }

    codeSanitizedDoc += content
  }

  let model = 'gpt-3.5-turbo'
  let onResponse = ''

  // find all the interpolation variables from dynamic code blocks
  for (const jsxNode of parsedDocument.filter(d => d.type === 'block')) {
    if (jsxNode.tag === 'Test') {
      // don't strip away codeblocks, yet
      // doc = doc.substring(0, jsxNode.position.start.offset) + doc.substring(jsxNode.position.end.offset)
      continue // ignore all interpolation sequences / requirements in code blocks
    }
    if (jsxNode.tag === 'State') {
      continue
    }
    if (jsxNode.tag === 'Transcript') {
      continue
    }
    if (jsxNode.tag === 'Request') {
      const modelAttr = jsxNode.attrs!.find(a => a.name === 'model')
      // value is either <Request model="gpt-3.5-turbo" /> or <Request model={"gpt-4"} />
      // we don't currently support dynamic model values
      model = modelAttr ? modelAttr.stringValue || JSON.parse(modelAttr.expressionValue!) : model

      const onResponseAttr = jsxNode.attrs!.find(a => a.name === 'onResponse')
      onResponse = onResponseAttr ? onResponseAttr.expressionValue! : ''
      continue
    }
    const jsxString = originalDoc.substring(jsxNode.position.start.offset, jsxNode.position.end.offset)
    const parsedJsx = parseJsxElement(jsxString)
    const attrs = parseJsxAttributes(jsxString)
    const asKey = attrs['as']

    if (asKey) {
      interpolationVarSet.delete(asKey) // sketchy removal, could cause problems if we have another variable defined with same name but fine for now
    }

    for (const s of parsedJsx.undeclaredVariables) {
      if (s === asKey) {
        // <For each={messages} as="m"> puts "m" in scope
        continue
      }
      interpolationVarSet.add(s)
    }
  }

  let toplevelCode = parsedDocument
    .filter(d => d.type === 'code')
    .map(d => d.content)
    .join('\n')

  const codeBlock = parseCodeBlock(toplevelCode)

  const trimmedImports = removeImports(toplevelCode)
  toplevelCode = trimmedImports.trimmedCode
  let imports = trimmedImports.imports

  imports = rewriteImports(
    imports,
    outputDirectory.replace('${workspaceFolder}', workspaceFolder),
    path.join(folderPath, fileName)
  )

  const glassImports = parseTsGlassImports(imports)
  const dependencyGlassDocs = glassImports.flatMap(gi => {
    const res = transpileGlassHelper(workspaceFolder, path.join(workspaceFolder, gi.path), language, outputDirectory)
    return res.map(r => ({ ...r, symbolName: gi.name }))
  })

  for (const symbol of codeBlock.symbolsAddedToScope) {
    interpolationVarSet.delete(symbol)
  }
  for (const symbol of codeBlock.importedSymbols) {
    interpolationVarSet.delete(symbol)
  }
  for (const symbol of codeBlock.undeclaredValuesNeededInScope) {
    if (symbol === 'useState') {
      continue
    }
    interpolationVarSet.add(symbol)
  }

  TYPESCRIPT_GLOBALS.forEach(globalValue =>
    // remove all the globally defined values
    interpolationVarSet.delete(globalValue)
  )

  interpolationVarSet.delete('') // TODO: figure out where/why this shows up

  const argsOverride = parseFrontmatter(parsedDocument.find(n => n.type === 'frontmatter')?.content || '')?.args || {}
  const allInterpolationNames = Array.from(interpolationVarSet)
  const argsString = allInterpolationNames.map(arg => arg + `: ${argsOverride[arg] || 'string'}`).join(', ')
  let fullArgString = ''
  if (allInterpolationNames.length > 0) {
    fullArgString = language === 'typescript' ? `args: { ${argsString} }` : 'args'
  }
  const functionArgs = language === 'javascript' ? 'opt' : `opt: { ${fullArgString} }`

  const codePairs = getUseStatePairs(toplevelCode)
  // join them all together
  const context: any = {}
  for (const [k, v] of Object.entries(codePairs)) {
    context[v] = `(val) => GLASS_STATE[${k}] = val`
  }

  const escapedInterpolatedDoc = glasslib
    .parseGlassDocument(codeSanitizedDoc)
    .map(b => {
      if (b.type === 'block') {
        // if it's a block, we need to escape the backticks but only in the attributes
        const bContentWithoutChild =
          b.content.substring(0, b.child!.position.start.offset - b.position.start.offset) +
          'GLASSCHILD' +
          b.content.substring(b.child!.position.end.offset - b.position.start.offset)
        return bContentWithoutChild
          .replace(/\$\{(.*?)\}/g, function (match, contents) {
            if (contents.startsWith('GLASSVAR[')) {
              return match
            }
            return '\\' + match
          })
          .replace('GLASSCHILD', b.child!.content)
      }
      if (b.type !== 'code') {
        return b.content
      }
      // replace all instances of ${.+} with \${.+}, as long as .+ doesn't start with GLASSVAR
      return b.content.replace(/\$\{(.*?)\}/g, function (match, contents) {
        if (contents.startsWith('GLASSVAR[')) {
          return match
        }
        return '\\' + match
      })
    })
    .join('')
    .replaceAll('`', '\\`')

  const code = `${imports.replace(/import .+ from ['"].+\.glass['"]/gm, '')}
${dependencyGlassDocs
  .map(g => {
    return `
  ${g.code}

  async function ${g.symbolName}(args: any) {
    const { getTestData, compile } = ${g.exportName}()
    const c = await compile({ args })
    const res = await runGlass(c as any)
    return res.codeResponse !== undefined ? res.codeResponse : res.rawResponse
  }
`
  })
  .join('\n\n')}

export function ${exportName}() {
  ${transformTsTestBlock(testContent)}

  const compile = async (${functionArgs}) => {${language === 'javascript' ? '\n  opt = opt || {}' : ''}
    const GLASS_STATE = ${JSON.stringify(state)}
    ${argsString ? `const {${allInterpolationNames.join(',')}} = opt.args` : ''}
    ${transformSetState(toplevelCode)}
    const GLASSVAR = {
      ${Object.keys(codeInterpolationMap)
        .map(k => `"${k}": ${codeInterpolationMap[k]}`)
        .join(',')}
    }
    const TEMPLATE = \`${escapedInterpolatedDoc}\`
    return {
      fileName: '${fileName}',
      model: '${model}',
      interpolatedDoc: TEMPLATE,
      originalDoc: ${JSON.stringify(originalDoc)},
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: ${onResponse ? onResponse : 'undefined'}
    }
  }

  return { getTestData, compile }
}`

  const formattedCode = prettier.format(code, {
    parser: 'typescript',
    printWidth: 120,
    arrowParens: 'avoid',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
  })
  return {
    code: formattedCode.trim(),
    args: [],
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

  import { runGlass, useState } from '@glass-lang/glasslib'

  ${functionsString}

  ${glassConstant}
  `

  const output = prettier.format(code, {
    parser: 'typescript',
    printWidth: 120,
    arrowParens: 'avoid',
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

export function getGlassExportName(filePath: string) {
  let fileName = filePath.split('/').pop() || ''
  if (fileName.endsWith('.glass')) {
    fileName = fileName.slice(0, -6)
  }

  const functionName = camelcase(fileName)

  const prefixGet = !(functionName.startsWith('get') && functionName[3] === functionName[3].toUpperCase())
  return `${prefixGet ? `get${functionName.slice(0, 1).toUpperCase() + functionName.slice(1)}` : functionName}Prompt`
}
