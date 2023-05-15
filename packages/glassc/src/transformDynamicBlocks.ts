import { transformArrowFunctionExpressionWithJsx } from './parseJSX'
import { parseGlassASTJSX } from './util/parseGlassAST'

export function transformDynamicBlocks(doc: string) {
  const jsxNodes = parseGlassASTJSX(doc)

  const jsxInterpolations: any = {}

  let currOffset = 0

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]

    if (node.tagName === 'For') {
      const eachAttr = node.attrs.find(attr => attr.name === 'each')!
      const fragment = node.attrs.find(attr => attr.name === 'fragment')!

      const startOffset = node.position.start.offset
      const endOffset = node.position.end.offset

      jsxInterpolations['jsx-' + i] = `${
        eachAttr.stringValue || eachAttr.expressionValue
      }.map(${transformArrowFunctionExpressionWithJsx(fragment.expressionValue!)}).join('\\n\\n')`

      const oldSequenceLength = endOffset - startOffset
      const newSequenceLength = `\${jsx-${i}}`.length

      doc = doc.substring(0, startOffset + currOffset) + `\${jsx-${i}}` + doc.substring(endOffset + currOffset)

      currOffset += newSequenceLength - oldSequenceLength
    }
  }

  return { doc, jsxInterpolations }
}
