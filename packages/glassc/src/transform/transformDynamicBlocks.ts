import glasslib from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import { transformGlassDocumentToTemplateString } from './transformGlassDocToTemplateString'
import { transformJsxExpressionToTemplateString } from './transformJsxExpressionToTemplateString'

export function transformDynamicBlocks(doc: string, next?: boolean) {
  const jsxNodes = glasslib.parseGlassTopLevelJsxElements(doc)

  let jsxInterpolations: any = {}

  let currOffset = 0

  const origDoc = doc

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]
    checkOk(node.type === 'mdxJsxFlowElement', 'Expected node to be of type mdxJsxFlowElement')

    const nodeStartOffset = node.position.start.offset
    const nodeEndOffset = node.position.end.offset

    let docSection = origDoc.substring(nodeStartOffset, nodeEndOffset)
    // let docSection = doc.substring(nodeStartOffset + currOffset, nodeEndOffset + currOffset)

    const nodeInsides =
      node.children.length === 0
        ? ''
        : docSection.substring(
            node.children[0].position.start.offset - nodeStartOffset,
            node.children[node.children.length - 1].position.end.offset - nodeStartOffset
          )

    const transformedNode = nestedTagHelper(Object.keys(jsxInterpolations).length, docSection, node, next)
    jsxInterpolations = { ...jsxInterpolations, ...transformedNode.jsxInterpolations }

    const updateToOffset = transformedNode.newSection.length - transformedNode.origSection.length

    doc =
      doc.substring(0, nodeStartOffset + currOffset) +
      transformedNode.newSection +
      doc.substring(nodeEndOffset + currOffset)
    docSection = transformedNode.newSection
    // currOffset += updateToOffset do this later

    const currInterpolationIndex = Object.keys(jsxInterpolations).length

    const interpKey = next ? 'GLASSVAR[' + currInterpolationIndex + ']' : 'jsx-' + currInterpolationIndex
    const pruneInterpKey = next ? '' + currInterpolationIndex : 'jsx-' + currInterpolationIndex

    const oldSequenceLength = docSection.length
    const newSequenceLength = `\${${interpKey}}`.length

    const ifAttr = node.attrs.find(attr => attr.name === 'if')
    if (ifAttr != null) {
      if (ifAttr.stringValue != null) {
        ifAttr.expressionValue = ifAttr.stringValue
      }
    }

    if (node.tagName === 'For') {
      const eachAttr = node.attrs.find(attr => attr.name === 'each')!
      const fragment = node.attrs.find(attr => attr.name === 'fragment')!
      const item = node.attrs.find(attr => attr.name === 'as')!
      checkOk(fragment || item, '<For> loop requires either "fragment" or "as" attribute')
      checkOk(eachAttr, '<For> loop requires both "each" attribute')

      if (fragment != null) {
        if (ifAttr?.expressionValue != null) {
          jsxInterpolations[pruneInterpKey] = `${ifAttr.expressionValue} ? ${
            eachAttr.stringValue || eachAttr.expressionValue
          }.map(${transformJsxExpressionToTemplateString(fragment.expressionValue!)}).join('\\n\\n') : ''`
        } else {
          jsxInterpolations[pruneInterpKey] = `${
            eachAttr.stringValue || eachAttr.expressionValue
          }.map(${transformJsxExpressionToTemplateString(fragment.expressionValue!)}).join('\\n\\n')`
        }
      } else {
        if (ifAttr?.expressionValue != null) {
          jsxInterpolations[pruneInterpKey] = `${ifAttr?.expressionValue} ? ${
            eachAttr.stringValue || eachAttr.expressionValue
          }.map(${item.stringValue} => \`${transformGlassDocumentToTemplateString(nodeInsides)}\`).join('\\n\\n') : ''`
        } else {
          jsxInterpolations[pruneInterpKey] = `${eachAttr.stringValue || eachAttr.expressionValue}.map(${
            item.stringValue
          } => \`${transformGlassDocumentToTemplateString(nodeInsides)}\`).join('\\n\\n')`
        }
      }

      doc =
        doc.substring(0, nodeStartOffset + currOffset) + `\${${interpKey}}` + doc.substring(nodeEndOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    } else if (ifAttr?.expressionValue != null) {
      jsxInterpolations[pruneInterpKey] = `${ifAttr.expressionValue} ? \`${docSection}\` : ''`

      doc =
        doc.substring(0, nodeStartOffset + currOffset) +
        `\${${interpKey}}` +
        doc.substring(nodeEndOffset + currOffset + updateToOffset)
      currOffset += newSequenceLength - oldSequenceLength + updateToOffset
    }
  }

  return { doc, jsxInterpolations }
}
// export function transformDynamicBlocks(doc: string) {
//   const jsxNodes = parseGlassASTJSX(doc)

//   const jsxInterpolations: any = {}

//   let currOffset = 0
//   const currInterpolation = 0

//   for (let i = 0; i < jsxNodes.length; i++) {
//     const node = jsxNodes[i]
//     checkOk(node.type === 'mdxJsxFlowElement', 'Expected node to be of type mdxJsxFlowElement')

//     const startOffset = node.position.start.offset
//     const endOffset = node.position.end.offset

//     const docSection = doc.substring(startOffset + currOffset, endOffset + currOffset)

//     const oldSequenceLength = endOffset - startOffset
//     const newSequenceLength = `\${jsx-${i}}`.length

//     const ifAttr = node.attrs.find(attr => attr.name === 'if')
//     if (ifAttr != null) {
//       if (ifAttr.stringValue != null) {
//         ifAttr.expressionValue = ifAttr.stringValue
//       }
//     }

//     console.log('nested resp', nestedTagHelper(0, docSection, node))

//     if (node.tagName === 'For') {
//       const eachAttr = node.attrs.find(attr => attr.name === 'each')!
//       const fragment = node.attrs.find(attr => attr.name === 'fragment')!
//       checkOk(eachAttr && fragment, '<For> loop requires both "each" and "fragment" attributes')

//       if (ifAttr?.expressionValue != null) {
//         jsxInterpolations['jsx-' + i] = `${ifAttr.expressionValue} ? ${
//           eachAttr.stringValue || eachAttr.expressionValue
//         }.map(${transformJSXExpressionToTemplateString(fragment.expressionValue!)}).join('\\n\\n') : ''`
//       } else {
//         jsxInterpolations['jsx-' + i] = `${
//           eachAttr.stringValue || eachAttr.expressionValue
//         }.map(${transformJSXExpressionToTemplateString(fragment.expressionValue!)}).join('\\n\\n')`
//       }

//       doc = doc.substring(0, startOffset + currOffset) + `\${jsx-${i}}` + doc.substring(endOffset + currOffset)
//       currOffset += newSequenceLength - oldSequenceLength
//     } else if (ifAttr?.expressionValue != null) {
//       jsxInterpolations['jsx-' + i] = `${ifAttr.expressionValue} ? \`${docSection}\` : ''`

//       doc = doc.substring(0, startOffset + currOffset) + `\${jsx-${i}}` + doc.substring(endOffset + currOffset)
//       currOffset += newSequenceLength - oldSequenceLength
//     }
//   }

//   return { doc, jsxInterpolations }
// }

function nestedTagHelper(currInterpolation: number, doc: string, docNode: glasslib.JSXNode, next?: boolean) {
  let jsxInterpolations: any = {}

  if (docNode.children.length === 0) {
    return { jsxInterpolations, origSection: doc, newSection: doc }
  }

  let currOffset = 0

  const firstChild = docNode.children[0]
  const lastChild = docNode.children[docNode.children.length - 1]

  const sectionStart = docNode.position.start.offset

  let nodeInsides = doc.substring(
    firstChild.position.start.offset - sectionStart,
    lastChild.position.end.offset - sectionStart
  )

  const innerNodes = glasslib.parseGlassTopLevelJsxElements(nodeInsides)

  for (let i = 0; i < innerNodes.length; i++) {
    const node = innerNodes[i]
    checkOk(node.type === 'mdxJsxFlowElement', 'Expected node to be of type mdxJsxFlowElement')

    const startOffset = node.position.start.offset
    const endOffset = node.position.end.offset

    const docSection = nodeInsides.substring(startOffset + currOffset, endOffset + currOffset)

    const interpolationIndex = currInterpolation + Object.keys(jsxInterpolations).length

    const nestedResp = nestedTagHelper(interpolationIndex, docSection, node, next)
    jsxInterpolations = { ...jsxInterpolations, ...nestedResp.jsxInterpolations }
    currInterpolation += Object.keys(nestedResp.jsxInterpolations).length

    const interpKey = next ? 'GLASSVAR[' + interpolationIndex + ']' : 'jsx-' + interpolationIndex
    const pruneInterpKey = next ? '' + interpolationIndex : 'jsx-' + interpolationIndex

    const oldSequenceLength = endOffset - startOffset
    const newSequenceLength = `\${${interpKey}}`.length

    const ifAttr = node.attrs.find(attr => attr.name === 'if')
    if (ifAttr != null) {
      if (ifAttr.stringValue != null) {
        ifAttr.expressionValue = ifAttr.stringValue
      }
    }

    if (node.tagName === 'For') {
      const eachAttr = node.attrs.find(attr => attr.name === 'each')!
      const fragment = node.attrs.find(attr => attr.name === 'fragment')!
      const item = node.attrs.find(attr => attr.name === 'as')!
      checkOk(fragment || item, '<For> loop requires either "fragment" or "as" attribute')
      checkOk(eachAttr, '<For> loop requires both "each" attribute')

      if (fragment != null) {
        if (ifAttr?.expressionValue != null) {
          jsxInterpolations[pruneInterpKey] = `${ifAttr.expressionValue} ? ${
            eachAttr.stringValue || eachAttr.expressionValue
          }.map(${transformJsxExpressionToTemplateString(fragment.expressionValue!)}).join('\\n\\n') : ''`
        } else {
          jsxInterpolations[pruneInterpKey] = `${
            eachAttr.stringValue || eachAttr.expressionValue
          }.map(${transformJsxExpressionToTemplateString(fragment.expressionValue!)}).join('\\n\\n')`
        }
      } else {
        if (ifAttr?.expressionValue != null) {
          jsxInterpolations[pruneInterpKey] = `${ifAttr?.expressionValue} ? ${
            eachAttr.stringValue || eachAttr.expressionValue
          }.map(${item.stringValue} => \`${transformGlassDocumentToTemplateString(nodeInsides)}\`).join('\\n\\n') : ''`
        } else {
          jsxInterpolations[pruneInterpKey] = `${eachAttr.stringValue || eachAttr.expressionValue}.map(${
            item.stringValue
          } => \`${transformGlassDocumentToTemplateString(nodeInsides)}\`).join('\\n\\n')`
        }
      }

      nodeInsides =
        nodeInsides.substring(0, startOffset + currOffset) +
        `\${${interpKey}}` +
        nodeInsides.substring(endOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    } else if (ifAttr?.expressionValue != null) {
      jsxInterpolations[pruneInterpKey] = `${ifAttr.expressionValue} ? \`${docSection}\` : ''`

      nodeInsides =
        nodeInsides.substring(0, startOffset + currOffset) +
        `\${${interpKey}}` +
        nodeInsides.substring(endOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    }
  }

  const newSection =
    doc.substring(0, firstChild.position.start.offset - sectionStart) +
    nodeInsides +
    doc.substring(lastChild.position.end.offset - sectionStart)

  return { jsxInterpolations, origSection: doc, newSection }
}
