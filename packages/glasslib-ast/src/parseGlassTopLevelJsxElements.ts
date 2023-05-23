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

/**
 * Takes a glass document and returns all the top-level JSX elements.
 * For example, in the the document:
 *
 * ```glass
 * <div>hello</div>
 *
 * interstitial text
 *
 * <div>world</div>
 * ```
 *
 * There are 2 top-level JSX elements: `<div>hello</div>` and `<div>world</div>`.
 *
 * The `interstitial text` is not a top-level JSX element and is ignored by this function.
 */
export function parseGlassTopLevelJsxElements(doc: string) {
  // preprocessing: remove all comments

  const mdxSettings = {
    acorn: Parser.extend(acornJsx()),
    acornOptions: { ecmaVersion: 2020, sourceType: 'module' },
    addResult: true,
  }

  const mdxExtension = combineExtensions([
    mdxjsEsm(mdxSettings as any),
    mdxExpression(), // to make the expression JavaScript agnostic
    mdxJsx(),
    mdxMd,
  ])

  const tree = fromMarkdown(doc, {
    // extensions: [mdxjs(), frontmatter(['yaml', 'toml'])],
    extensions: [mdxExtension, frontmatter(['yaml', 'toml'])],
    mdastExtensions: [mdxFromMarkdown(), frontmatterFromMarkdown(['yaml', 'toml'])],
  })

  const jsx: any[] = []

  for (const node of tree.children) {
    parseJSXElementHelper(node, jsx)
  }

  return jsx
}

function parseJSXElementHelper(node: any, jsx: any[]) {
  switch (node.type) {
    case 'paragraph': {
      for (const child of node.children) {
        parseJSXElementHelper(child, jsx)
      }

      break
    }

    case 'mdxJsxFlowElement': {
      jsx.push(glassASTNodeToJSXNode(node))
      break
    }

    default:
      if (node.children instanceof Array) {
        for (const child of node.children) {
          parseJSXElementHelper(child, jsx)
        }
      }
      break
  }
}

export function glassASTNodeToJSXNode(node: any) {
  const tagName = node.name
  const position = node.position
  const value = node.value
  const attrs = (node.attributes || []).map((attr: any) => {
    const attrName: string = attr.name
    if (typeof attr.value === 'string') {
      return { name: attrName, stringValue: attr.value }
    }
    const attrValue: string = attr.value.value
    return { name: attrName, expressionValue: attrValue }
  })
  const children = (node.children || []).map((child: any) => glassASTNodeToJSXNode(child))
  const res: any = { tagName, attrs, position, children, type: node.type }
  if (value != null) {
    res['value'] = value
  }
  return res
}
