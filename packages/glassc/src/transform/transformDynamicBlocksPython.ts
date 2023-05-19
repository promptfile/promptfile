import { checkOk } from '@glass-lang/util'
import { JSXNode } from '../parse/parseGlassAST'
import { parseGlassTopLevelJsxElements } from '../parse/parseGlassTopLevelJsxElements'
import { transformGlassDocumentToTemplateStringPython } from './transformGlassDocToTemplateString'

export function transformDynamicBlocksPython(doc: string) {
  const jsxNodes = parseGlassTopLevelJsxElements(doc)

  let jsxInterpolations: any = {}

  let currOffset = 0

  const origDoc = doc

  const undeclaredSymbols = new Set<string>([])

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

    const transformedNode = nestedTagHelper(Object.keys(jsxInterpolations).length, docSection, node)
    jsxInterpolations = { ...jsxInterpolations, ...transformedNode.jsxInterpolations }
    for (const s of transformedNode.undeclaredSymbols) {
      undeclaredSymbols.add(s)
    }

    const updateToOffset = transformedNode.newSection.length - transformedNode.origSection.length

    doc =
      doc.substring(0, nodeStartOffset + currOffset) +
      transformedNode.newSection +
      doc.substring(nodeEndOffset + currOffset)
    docSection = transformedNode.newSection
    // currOffset += updateToOffset do this later

    const currInterpolationIndex = Object.keys(jsxInterpolations).length

    const interpKey = 'GLASSVAR[' + currInterpolationIndex + ']'
    const pruneInterpKey = '' + currInterpolationIndex

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
      const item = node.attrs.find(attr => attr.name === 'item')!
      checkOk(eachAttr, '<For> loop requires both "each" and "fragment" attributes')

      const transform = transformGlassDocumentToTemplateStringPython(nodeInsides)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }
      undeclaredSymbols.delete(item.stringValue || '')

      if (ifAttr?.expressionValue != null) {
        jsxInterpolations[pruneInterpKey] = `"\\n\\n".join(list(map(lambda ${item.stringValue}: """{}""".format(${
          transform.newDocument
        }), ${eachAttr.stringValue || eachAttr.expressionValue}))) if ${ifAttr?.expressionValue} else ''`
      } else {
        jsxInterpolations[pruneInterpKey] = `"\\n\\n".join(list(map(lambda ${item.stringValue}: """{}""".format(${
          transform.newDocument
        }), ${eachAttr.stringValue || eachAttr.expressionValue})))`
      }

      doc =
        doc.substring(0, nodeStartOffset + currOffset) + `\${${interpKey}}` + doc.substring(nodeEndOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    } else if (ifAttr?.expressionValue != null) {
      const transform = transformGlassDocumentToTemplateStringPython(docSection)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }

      jsxInterpolations[pruneInterpKey] = `${transform.newDocument} if ${ifAttr.expressionValue} else ''`

      doc =
        doc.substring(0, nodeStartOffset + currOffset) +
        `\${${interpKey}}` +
        doc.substring(nodeEndOffset + currOffset + updateToOffset)
      currOffset += newSequenceLength - oldSequenceLength + updateToOffset
    }
  }

  undeclaredSymbols.delete('GLASSVAR')
  return { doc, jsxInterpolations, undeclaredSymbols: Array.from(undeclaredSymbols) }
}

function nestedTagHelper(currInterpolation: number, doc: string, docNode: JSXNode) {
  let jsxInterpolations: any = {}

  if (docNode.children.length === 0) {
    return { jsxInterpolations, origSection: doc, newSection: doc, undeclaredSymbols: [] }
  }

  let currOffset = 0

  const undeclaredSymbols = new Set<string>([])

  const firstChild = docNode.children[0]
  const lastChild = docNode.children[docNode.children.length - 1]

  const sectionStart = docNode.position.start.offset

  let nodeInsides = doc.substring(
    firstChild.position.start.offset - sectionStart,
    lastChild.position.end.offset - sectionStart
  )

  const innerNodes = parseGlassTopLevelJsxElements(nodeInsides)

  for (let i = 0; i < innerNodes.length; i++) {
    const node = innerNodes[i]
    checkOk(node.type === 'mdxJsxFlowElement', 'Expected node to be of type mdxJsxFlowElement')

    const startOffset = node.position.start.offset
    const endOffset = node.position.end.offset

    const docSection = nodeInsides.substring(startOffset + currOffset, endOffset + currOffset)

    const interpolationIndex = currInterpolation + Object.keys(jsxInterpolations).length

    const nestedResp = nestedTagHelper(interpolationIndex, docSection, node)
    jsxInterpolations = { ...jsxInterpolations, ...nestedResp.jsxInterpolations }
    currInterpolation += Object.keys(nestedResp.jsxInterpolations).length
    for (const s of nestedResp.undeclaredSymbols) {
      undeclaredSymbols.add(s)
    }

    const interpKey = 'GLASSVAR[' + interpolationIndex + ']'
    const pruneInterpKey = '' + interpolationIndex

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
      const item = node.attrs.find(attr => attr.name === 'item')!
      checkOk(eachAttr, '<For> loop requires both "each" and "fragment" attributes')

      const transform = transformGlassDocumentToTemplateStringPython(nodeInsides)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }

      if (ifAttr?.expressionValue != null) {
        jsxInterpolations[pruneInterpKey] = `"\\n\\n".join(list(map(lambda ${item.stringValue}: """{}""".format(${
          transform.newDocument
        }), ${eachAttr.stringValue || eachAttr.expressionValue}))) if ${ifAttr?.expressionValue} else ''`
      } else {
        jsxInterpolations[pruneInterpKey] = `"\\n\\n".join(list(map(lambda ${item.stringValue}: """{}""".format(${
          transform.newDocument
        }), ${eachAttr.stringValue || eachAttr.expressionValue})))`
      }

      nodeInsides =
        nodeInsides.substring(0, startOffset + currOffset) +
        `\${${interpKey}}` +
        nodeInsides.substring(endOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    } else if (ifAttr?.expressionValue != null) {
      const transform = transformGlassDocumentToTemplateStringPython(docSection)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }

      jsxInterpolations[pruneInterpKey] = `${transform.newDocument} if ${ifAttr.expressionValue} else ''`

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

  undeclaredSymbols.delete('GLASSVAR')
  return { jsxInterpolations, origSection: doc, newSection, undeclaredSymbols: Array.from(undeclaredSymbols) }
}
