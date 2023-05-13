import { removeGlassComments } from '@glass-lang/interpolator'
import { Parser } from 'acorn'
import acornJsx from 'acorn-jsx'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { frontmatter } from 'micromark-extension-frontmatter'
import { mdxExpression } from 'micromark-extension-mdx-expression'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import { mdxMd } from 'micromark-extension-mdx-md'
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm'
import { combineExtensions } from 'micromark-util-combine-extensions'
import * as path from 'node:path'
import { removeGlassFrontmatter } from '../removeGlassFrontmatter'
import { checkOk } from './checkOk'

export interface JSXNode {
  tagName: string
  attrs: { name: string; stringValue?: string; expressionValue?: string }[]
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

export function parseGlassAST(
  doc: string,
  folders: { workspaceFolder: string; folderPath: string; outputDirectory: string; fileName: string }
) {
  // preprocessing: remove all comments
  doc = removeGlassComments(doc)

  const mdxSettings = {
    acorn: Parser.extend(acornJsx()),
    acornOptions: { ecmaVersion: 2020, sourceType: 'module' },
    addResult: true,
  }

  const mdxExtension = combineExtensions([
    mdxjsEsm(mdxSettings as any),
    mdxExpression(), // to make the expression JavaScript agnostic
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
  const jsxNodes: JSXNode[] = []
  let isAsync = false

  for (const node of tree.children) {
    const async = parseAstHelper(
      folders,
      node,
      parts,
      imports,
      frontmatterArgs,
      interpolationArgs,
      jsxExpressions,
      jsxNodes
    )
    if (async) {
      isAsync = true
    }
  }

  return { parts, imports, frontmatterArgs, interpolationArgs, jsxExpressions, jsxNodes, isAsync }
}

function parseAstHelper(
  folders: { workspaceFolder: string; folderPath: string; fileName: string; outputDirectory: string },
  node: any,
  parts: string[],
  imports: string[],
  frontmatterArgs: { name: string; type: string; description?: string; optional?: boolean }[],
  interpolationArgs: Record<string, boolean>,
  jsxExpressions: string[],
  jsxNodes: JSXNode[]
) {
  let isAsync = false

  switch (node.type) {
    case 'paragraph': {
      const paraParts: string[] = []
      for (const child of node.children) {
        const async = parseAstHelper(
          folders,
          child,
          paraParts,
          imports,
          frontmatterArgs,
          interpolationArgs,
          jsxExpressions,
          jsxNodes
        )
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

      if (node.type === 'mdxJsxFlowElement') {
        jsxNodes.push(parseJSXNode(node))
      }

      if (node.children instanceof Array) {
        for (const child of node.children) {
          const async = parseAstHelper(
            folders,
            child,
            paraParts,
            imports,
            frontmatterArgs,
            interpolationArgs,
            jsxExpressions,
            jsxNodes
          )
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

export function parseGlassASTImports(doc: string) {
  // preprocessing: remove all comments
  doc = removeGlassComments(doc)

  const mdxSettings = {
    acorn: Parser.extend(acornJsx()),
    acornOptions: { ecmaVersion: 2020, sourceType: 'module' },
    addResult: true,
  }

  const mdxExtension = combineExtensions([
    mdxjsEsm(mdxSettings as any),
    mdxExpression(), // to make the expression JavaScript agnostic
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

  const imports: string[] = []

  for (const node of tree.children) {
    parseImportsHelper(node, imports)
  }

  return imports
}

function parseImportsHelper(node: any, imports: string[]) {
  switch (node.type) {
    case 'paragraph': {
      for (const child of node.children) {
        parseImportsHelper(child, imports)
      }

      break
    }

    case 'mdxjsEsm': {
      imports.push(node.value)
      break
    }

    default:
      if (node.children instanceof Array) {
        for (const child of node.children) {
          parseImportsHelper(child, imports)
        }
      }
      break
  }
}

export function parseGlassASTJSX(doc: string) {
  // preprocessing: remove all comments
  doc = removeGlassComments(doc)

  const mdxSettings = {
    acorn: Parser.extend(acornJsx()),
    acornOptions: { ecmaVersion: 2020, sourceType: 'module' },
    addResult: true,
  }

  const mdxExtension = combineExtensions([
    mdxjsEsm(mdxSettings as any),
    mdxExpression(), // to make the expression JavaScript agnostic
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

  const jsx: JSXNode[] = []

  for (const node of tree.children) {
    parseJSXHelper(node, jsx)
  }

  return jsx
}

function parseJSXHelper(node: any, jsx: JSXNode[]) {
  switch (node.type) {
    case 'paragraph': {
      for (const child of node.children) {
        parseJSXHelper(child, jsx)
      }

      break
    }

    case 'mdxJsxFlowElement': {
      jsx.push(parseJSXNode(node))
      break
    }

    default:
      if (node.children instanceof Array) {
        for (const child of node.children) {
          parseJSXHelper(child, jsx)
        }
      }
      break
  }
}

function parseJSXNode(node: any) {
  const tagName = node.name
  const position = node.position
  const attrs = node.attributes.map((attr: any) => {
    checkOk(attr.type === 'mdxJsxAttribute', `Expected attribute node type 'mdxJsxAttribute', got '${attr.type}'`)
    const attrName: string = attr.name
    if (typeof attr.value === 'string') {
      return { name: attrName, stringValue: attr.value }
    }
    checkOk(
      attr.value.type === 'mdxJsxAttributeValueExpression',
      `Expected attribute value node type 'mdxJsxAttributeValueExpression', got '${attr.value.type}'`
    )
    const attrValue: string = attr.value.value
    return { name: attrName, expressionValue: attrValue }
  })
  return { tagName, attrs, position }
}
