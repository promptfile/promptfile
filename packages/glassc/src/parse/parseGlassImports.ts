import { removeGlassComments } from '@glass-lang/glasslib'
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
import { removeGlassFrontmatter } from '../transform/removeGlassFrontmatter'

export function parseGlassImports(doc: string) {
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
