import { Parser } from 'acorn'
import acornJsx from 'acorn-jsx'
import camelcase from 'camelcase'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { frontmatter } from 'micromark-extension-frontmatter'
import { mdxExpression } from 'micromark-extension-mdx-expression'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import { mdxMd } from 'micromark-extension-mdx-md'
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm'
import { combineExtensions } from 'micromark-util-combine-extensions'
import * as fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import { parseGlassBlocks } from './parseGlassBlocks.js'
import { removeGlassComments } from './removeGlassComments.js'
import { removeGlassFrontmatter } from './removeGlassFrontmatter.js'

const extension = 'glass'

/**
 * Takes a .glass document and returns a code file.
 * The directory / folder information is necessary so we can correctly re-write import paths.
 * The language is necessary so we can correctly format the output. Currently only supports 'typescript'.
 */
export function transpileGlassFile(
  doc: string,
  {
    workspaceFolder,
    folderPath,
    outputDirectory,
    fileName,
    language,
  }: { workspaceFolder: string; folderPath: string; outputDirectory: string; fileName: string; language: string }
) {
  // first, parse the document blocks to make sure the document is valid
  // this will also tell us if there are any special (e.g. <Code>) blocks that should appear unmodified in the final output
  const blocks = parseGlassBlocks(doc)
  if (blocks.length === 0) {
    throw new Error(`No blocks found in ${fileName}.${extension}, did you mean to add a <Prompt> block?`)
  }
  const codeBlocks = blocks.filter(b => b.tag === 'Code')

  // remove all block comments before any processing happens
  doc = removeGlassComments(doc)
  const functionName = camelcase(fileName)
  const isChat = isChatTemplate(doc)

  const mdxSettings = {
    acorn: Parser.extend(acornJsx()),
    acornOptions: { ecmaVersion: 2020, sourceType: 'module' },
    addResult: true,
  }

  const mdxExtension = combineExtensions([
    mdxjsEsm(mdxSettings as any),
    mdxExpression(),
    mdxJsx(mdxSettings as any),
    mdxMd,
  ])

  const tree = fromMarkdown(doc, {
    // extensions: [mdxjs(), frontmatter(['yaml', 'toml'])],
    extensions: [mdxExtension, frontmatter(['yaml', 'toml'])],
    mdastExtensions: [mdxFromMarkdown(), frontmatterFromMarkdown(['yaml', 'toml'])],
  })

  // remove frontmatter after parsing the AST
  doc = removeGlassFrontmatter(doc)

  const parts: string[] = []
  const imports: string[] = []
  const frontmatterArgs: { name: string; type: string; description?: string; optional?: boolean }[] = []
  const interpolationArgs: Record<string, boolean> = {}
  const jsxExpressions: string[] = []
  let isAsync = false

  for (const node of tree.children) {
    const async = parseAst(
      { workspaceFolder, folderPath, fileName, outputDirectory },
      node,
      parts,
      imports,
      frontmatterArgs,
      interpolationArgs,
      jsxExpressions
    )
    if (async) {
      isAsync = true
    }
  }

  if (language !== 'typescript' && language !== 'javascript') {
    throw new Error(`${language} not supported yet`)
  }

  // all variables inside {} are interpolation variables, including ones like {foo.bar}
  const allInterpolationVars = Object.keys(interpolationArgs)

  const kshotArguments = allInterpolationVars.filter(arg => {
    const [kshotName] = arg.split('.')
    return arg.indexOf('.') !== -1 && doc.indexOf(`-- [${kshotName}].`) !== -1
  })

  const nonKshotInterpolationVariables = allInterpolationVars.filter(arg => !kshotArguments.includes(arg))

  const interpolationVarNames = Array.from(
    new Set<string>(nonKshotInterpolationVariables.map(arg => arg.split('.')[0]))
  )

  if (frontmatterArgs.length > 0 && nonKshotInterpolationVariables.length > 0) {
    const frontmatterArgsRemaining = new Set<string>(frontmatterArgs.map(a => a.name))
    const frontmatterArgsUsed = new Set<string>([])
    // verify that all frontmatter args are used
    for (const interpolationVar of interpolationVarNames) {
      if (frontmatterArgsRemaining.has(interpolationVar)) {
        frontmatterArgsRemaining.delete(interpolationVar)
        frontmatterArgsUsed.add(interpolationVar)
      } else if (!frontmatterArgsUsed.has(interpolationVar)) {
        // throw new error? interpolation variable exists that's not declared by frontmatter
        throw new Error(`Variable ${interpolationVar} is not declared by frontmatter in ${functionName}.glass`)
        // return null
      }
    }

    if (frontmatterArgsRemaining.size !== 0) {
      console.log(
        `Frontmatter args ${Array.from(frontmatterArgsRemaining).join(', ')} are unused in ${functionName}.glass`
      )
    }
  }

  let argsString = frontmatterArgs
    .map(a => `${a.name}${language === 'javascript' ? '' : `${a.optional ? '?' : ''}: ${a.type}`}`)
    .join(', ')
  let fullArgString = frontmatterArgs.length ? (language === 'typescript' ? `args: { ${argsString} }` : 'args') : ''

  // TODO: handle adding kshot variables
  const kshotMap: any = {}
  for (const kshotArg of kshotArguments) {
    const [kshotName, kshotArgName] = kshotArg.split('.')
    if (!kshotMap[kshotName]) {
      kshotMap[kshotName] = []
    }
    kshotMap[kshotName].push(kshotArgName)
  }

  const allInterpolationNames = Array.from(new Set(interpolationVarNames.concat(Object.keys(kshotMap))))

  // TODO: fix this ugly
  if (frontmatterArgs.length === 0 && interpolationVarNames.length > 0) {
    argsString = interpolationVarNames
      .map(arg => arg + ': string')
      .concat(
        // add the kshots to the arguments
        Object.keys(kshotMap).map(kshotVariable => {
          return `${kshotVariable}: { ${kshotMap[kshotVariable]
            .map((kshotArg: any) => kshotArg + ': string')
            .join(', ')} }[]`
        })
      )
      .join(', ')
    fullArgString = language === 'typescript' ? `args: { ${argsString} }` : 'args'
  }

  let codeSanitizedDoc = doc
  const codeInterpolationMap: any = {}

  // iterate over all the jsxExpressions (values inside `{ }`) and replace them with a number if they're supposed to be treated like code (values inside `${ }`)

  for (let j = 0; j < jsxExpressions.length; j++) {
    const expr = jsxExpressions[j]

    const isKshotArgument = kshotArguments.includes(expr.trim())
    if (isKshotArgument) {
      // kshot arguments are not interpolated directly
      continue
    }

    const codeInterpolation = '${' + expr + '}'
    const indexOfInterpolation = codeSanitizedDoc.indexOf(codeInterpolation)
    if (indexOfInterpolation === -1) {
      continue
    }
    codeSanitizedDoc = codeSanitizedDoc.replace(codeInterpolation, `\${${j}}`)
    if (expr.trim().startsWith('async')) {
      codeInterpolationMap['' + j] = `await (${expr.trim()})()`
    } else if (expr.trim().startsWith('function')) {
      codeInterpolationMap['' + j] = `(${expr.trim()})()`
    } else {
      codeInterpolationMap['' + j] = expr.trim()
    }
  }

  // after interpolating everything, we can unescape `\{ \}` sequences
  // codeSanitizedDoc = unescapeGlass(codeSanitizedDoc)

  const prefixGet = !(functionName.startsWith('get') && functionName[3] === functionName[3].toUpperCase())
  const exportName = `${
    prefixGet ? `get${functionName.slice(0, 1).toUpperCase() + functionName.slice(1)}` : functionName
  }Prompt`

  const code = `${imports.join('\n')}

export ${isAsync ? 'async' : ''} function ${exportName}(${fullArgString}) {
  ${argsString ? `const {${allInterpolationNames.join(',')}} = args` : ''}
  ${codeBlocks.map(b => b.content).join('\n')}
  const interpolations = {
    ${Object.keys(codeInterpolationMap)
      .map(k => `"${k}": ${codeInterpolationMap[k]}`)
      .join(',')}
  }
  const TEMPLATE = ${JSON.stringify(codeSanitizedDoc)}
  return interpolateGlass${isChat ? 'Chat' : ''}('${fileName}', TEMPLATE, interpolations)
}`
  const formattedCode = prettier.format(code, {
    parser: 'babel',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
  })
  return {
    code: formattedCode.trim(),
    args: frontmatterArgs,
    imports,
    functionName,
    exportName,
    variableNames: allInterpolationNames,
  }
}

function isChatTemplate(doc: string) {
  return doc.indexOf('<System>') !== -1 || doc.indexOf('<User>') !== -1 || doc.indexOf('<Assistant>') !== -1
}

/**
 * Takes a path, either to a file or a folder, and transpiles all glass files in that folder, or the file specified.
 */
export function transpileGlass(
  workspaceFolder: string,
  fileOrFolderPath: string,
  language: string,
  outputDirectory: string
) {
  const functions = transpileGlassHelper(workspaceFolder, fileOrFolderPath, language, outputDirectory)
  return constructGlassOutputFile(functions)
}

export function constructGlassOutputFile(functions: ReturnType<typeof transpileGlassHelper>) {
  const glassConstant = `export const Glass = {
    ${functions.map(f => `${f.functionName}: ${f.exportName}`).join(',\n  ')}
  }`
  const functionsString = functions.map(f => f.code).join('\n\n')

  const usesNonchat = functionsString.indexOf('interpolateGlass(') !== -1
  const usesChat = functionsString.indexOf('interpolateGlassChat') !== -1

  const imports: string[] = []
  if (usesNonchat) {
    imports.push('interpolateGlass')
  }
  if (usesChat) {
    imports.push('interpolateGlassChat')
  }
  const importLine = usesChat || usesNonchat ? `import { ${imports.join(', ')} } from '@glass-lang/glassc'` : ''

  const code = `// THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

  ${importLine}

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
    const codegenedResult = transpileGlassFile(fileContent, {
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

function parseAst(
  folders: { workspaceFolder: string; folderPath: string; fileName: string; outputDirectory: string },
  node: any,
  parts: string[],
  imports: string[],
  frontmatterArgs: { name: string; type: string; description?: string; optional?: boolean }[],
  interpolationArgs: Record<string, boolean>,
  jsxExpressions: string[]
) {
  let isAsync = false

  switch (node.type) {
    case 'paragraph': {
      const paraParts: string[] = []
      for (const child of node.children) {
        const async = parseAst(folders, child, paraParts, imports, frontmatterArgs, interpolationArgs, jsxExpressions)
        if (async) {
          isAsync = true
        }
      }

      for (let i = 0; i < paraParts.length; i++) {
        const paraPart = paraParts[i]
        parts.push(paraPart)
        if (i === paraParts.length - 1) {
          parts.push(JSON.stringify('\n'))
        }
      }

      parts.push(JSON.stringify('\n'))

      break
    }

    case 'text': {
      parts.push(JSON.stringify(node.value))

      break
    }

    case 'mdxTextExpression': {
      if (node.value.startsWith('/*') && node.value.endsWith('*/')) {
        return // just a comment
      }

      jsxExpressions.push(node.value)

      // see if it's a valid interpolation arg (it is alphanumeric with optional _ and .)
      const interpolationArgMatch = node.value.trim().match(/^[a-zA-Z0-9_.]+$/)
      if (interpolationArgMatch) {
        interpolationArgs[interpolationArgMatch[0]] = true
      }

      const async = node.value.trim().startsWith('await')
      if (async) {
        isAsync = true
      }
      parts.push(node.value)

      break
    }

    case 'mdxFlowExpression': {
      const nodeText = node.value.trim()
      // If nodeText looks like a javascript comment block (e.g. /* */) ignore it
      if (nodeText.startsWith('/*') && nodeText.endsWith('*/')) {
        return
      }

      jsxExpressions.push(node.value)

      // see if it's a valid interpolation arg (it is alphanumeric with optional _ and .)
      const interpolationArgMatch = node.value.trim().match(/^[a-zA-Z0-9_.]+$/)
      if (interpolationArgMatch) {
        interpolationArgs[interpolationArgMatch[0]] = true
      }

      const lines = nodeText.split('\n')
      if (lines.length === 1) {
        parts.push(nodeText)
      } else if (lines.length > 1) {
        const async = nodeText.trim().startsWith('async')
        if (async) {
          isAsync = true
        }
        parts.push(`${nodeText.startsWith('async') ? 'await ' : ''}(${nodeText})()`)
      }

      parts.push('\n')

      break
    }

    case 'mdxjsEsm': {
      const { workspaceFolder, folderPath } = folders
      const importLine = node.value

      // find the import groups, importLine will match `import (.+) from '(.+)'`
      const match = /import (.+) from ['"](.+)['"]/gms.exec(importLine)
      if (!match) {
        return
      }
      const [, importName, importPath] = match

      // importPath is the path to the file being imported

      let resolvedPath = importPath

      if (importPath.startsWith('.')) {
        const targetDirectory = folders.outputDirectory
        const outDir = targetDirectory.replace('${workspaceFolder}', workspaceFolder)

        // current path to imort
        const currentFilePath = path.join(folderPath, importPath)

        // importPath is relative to currentFilePath; we need to make it relative to the output directory (outDir)
        let relativeImportPath = path.relative(outDir, currentFilePath)
        if (!relativeImportPath.startsWith('.')) {
          relativeImportPath = `./${relativeImportPath}`
        }

        resolvedPath = relativeImportPath
      }

      // imports.push(node.value)
      imports.push(`import ${importName} from '${resolvedPath}'`)

      break
    }

    case 'yaml': {
      // Do nothing, for now
      const lines = node.value.split('\n')
      for (const line of lines) {
        if (line.trim() === '') {
          continue
        }
        const [name, rest] = line.split(/:\s+/)
        const [type, description] = rest.split(/\s+/)
        const optional = type.endsWith('?')
        const normType = optional ? type.slice(0, -1) : type
        frontmatterArgs.push({ name, type: normType, description, optional })
      }

      break
    }

    case 'toml': {
      // Do nothing, for now
      const lines = node.value.split('\n')
      for (const line of lines) {
        if (line.trim() === '') {
          continue
        }
        const [name, rest] = line.split(/:\s+/)
        const [type, description] = rest.split(/\s+/)
        const optional = type.endsWith('?')
        const normType = optional ? type.slice(0, -1) : type
        frontmatterArgs.push({ name, type: normType, description, optional })
      }

      break
    }

    default:
      const paraParts: any[] = []
      if (node.children instanceof Array) {
        for (const child of node.children) {
          const async = parseAst(folders, child, paraParts, imports, frontmatterArgs, interpolationArgs, jsxExpressions)
          if (async) {
            isAsync = true
          }
        }

        for (let i = 0; i < paraParts.length; i++) {
          const paraPart = paraParts[i]
          parts.push(paraPart)
          if (i === paraParts.length - 1) {
            parts.push(JSON.stringify('\n'))
          }
        }

        parts.push(JSON.stringify('\n'))
      }
      break
  }
  return isAsync
}
