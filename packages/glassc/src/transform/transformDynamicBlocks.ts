import glasslib from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import { transformGlassDocumentToTemplateString } from './transformGlassDocToTemplateString'
import { transformJsxExpressionToTemplateString } from './transformJsxExpressionToTemplateString'

export function transformDynamicBlocks(doc: string, next?: boolean) {
  const jsxNodes = glasslib.parseGlassBlocks(doc)

  let jsxInterpolations: any = {}

  let currOffset = 0

  const origDoc = doc

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]

    const nodeStartOffset = node.position.start.offset
    const nodeEndOffset = node.position.end.offset

    let docSection = origDoc.substring(nodeStartOffset, nodeEndOffset)
    // let docSection = doc.substring(nodeStartOffset + currOffset, nodeEndOffset + currOffset)

    const nodeInsides = node.child!.content

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

    const ifAttr = node.attrs!.find(attr => attr.name === 'if')
    if (ifAttr != null) {
      if (ifAttr.stringValue != null) {
        ifAttr.expressionValue = ifAttr.stringValue
      }
    }

    if (node.tag === 'For') {
      const eachAttr = node.attrs!.find(attr => attr.name === 'each')!
      const fragment = node.attrs!.find(attr => attr.name === 'fragment')!
      const item = node.attrs!.find(attr => attr.name === 'as')!
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
      jsxInterpolations[pruneInterpKey] = `${ifAttr.expressionValue} ? \`${docSection.replace(
        /@\{(.+?)\}/g,
        (match, p1) => `\$\{${p1}\}`
      )}\` : ''`

      doc =
        doc.substring(0, nodeStartOffset + currOffset) +
        `\${${interpKey}}` +
        doc.substring(nodeEndOffset + currOffset + updateToOffset)
      currOffset += newSequenceLength - oldSequenceLength + updateToOffset
    }
  }

  return { doc, jsxInterpolations }
}

function nestedTagHelper(currInterpolation: number, doc: string, docNode: glasslib.GlassContent, next?: boolean) {
  let jsxInterpolations: any = {}

  if (!docNode.child?.content) {
    return { jsxInterpolations, origSection: doc, newSection: doc }
  }

  let currOffset = 0

  const sectionStart = docNode.position.start.offset

  let nodeInsides = docNode.child!.content

  const innerNodes = glasslib.parseGlassBlocks(nodeInsides)

  for (let i = 0; i < innerNodes.length; i++) {
    const node = innerNodes[i]

    const startOffset = node.position.start.offset
    const endOffset = node.position.end.offset

    const docSection = node.child!.content

    const interpolationIndex = currInterpolation + Object.keys(jsxInterpolations).length

    const nestedResp = nestedTagHelper(interpolationIndex, docSection, node, next)
    jsxInterpolations = { ...jsxInterpolations, ...nestedResp.jsxInterpolations }
    currInterpolation += Object.keys(nestedResp.jsxInterpolations).length

    const interpKey = next ? 'GLASSVAR[' + interpolationIndex + ']' : 'jsx-' + interpolationIndex
    const pruneInterpKey = next ? '' + interpolationIndex : 'jsx-' + interpolationIndex

    const oldSequenceLength = node.content.length
    const newSequenceLength = `\${${interpKey}}`.length

    const ifAttr = node.attrs!.find(attr => attr.name === 'if')
    if (ifAttr != null) {
      if (ifAttr.stringValue != null) {
        ifAttr.expressionValue = ifAttr.stringValue
      }
    }

    if (node.tag === 'For') {
      const eachAttr = node.attrs!.find(attr => attr.name === 'each')!
      const fragment = node.attrs!.find(attr => attr.name === 'fragment')!
      const item = node.attrs!.find(attr => attr.name === 'as')!
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
      // replace all @{foo} in docSection with ${foo}
      jsxInterpolations[pruneInterpKey] = `${ifAttr.expressionValue} ? \`${docSection.replace(
        /@\{(.+?)\}/g,
        (match, p1) => `\$\{${p1}\}`
      )}\` : ''`

      nodeInsides =
        nodeInsides.substring(0, startOffset + currOffset) +
        `\${${interpKey}}` +
        nodeInsides.substring(endOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    }
  }

  const newSection =
    doc.substring(0, docNode.child!.position.start.offset - sectionStart) +
    nodeInsides +
    doc.substring(docNode.child!.position.end.offset - sectionStart)

  return { jsxInterpolations, origSection: doc, newSection }
}
