import glasslib from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import { transformGlassDocumentToTemplateStringPython } from './transformGlassDocToTemplateString'

export function transformDynamicBlocksPython(doc: string) {
  const jsxNodes = glasslib.parseGlassDocument(doc)

  const jsxInterpolations: any = {}
  let nestedInterpolations: any = {}

  let currOffset = 0

  const origDoc = doc
  let builtDoc = ''

  const undeclaredSymbols = new Set<string>([])

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]
    if (node.type === 'comment' || node.type === 'frontmatter') {
      builtDoc += node.content.replace(/{/g, '{{').replace(/}/g, '}}')
      continue
    }

    const nodeStartOffset = node.position.start.offset
    const nodeEndOffset = node.position.end.offset

    let docSection = node.content

    const nodeInsides = node.child!.content

    const transformedNode = nestedTagHelper(Object.keys(nestedInterpolations).length, node.content, node)
    nestedInterpolations = { ...nestedInterpolations, ...transformedNode.jsxInterpolations }

    if (node.tag !== 'For') {
      // jsxInterpolations = { ...jsxInterpolations, ...transformedNode.jsxInterpolations }
    }
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

    const ifAttr = node.attrs!.find(attr => attr.name === 'if')
    if (ifAttr != null) {
      if (ifAttr.stringValue != null) {
        ifAttr.expressionValue = ifAttr.stringValue
      }
    }

    if (node.tag === 'For') {
      const eachAttr = node.attrs!.find(attr => attr.name === 'each')!
      const item = node.attrs!.find(attr => attr.name === 'as')!
      checkOk(eachAttr && item, '<For> loop requires both "each" and "as" attributes')

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

      builtDoc += `\${${interpKey}}`
      doc =
        doc.substring(0, nodeStartOffset + currOffset) + `\${${interpKey}}` + doc.substring(nodeEndOffset + currOffset)
      currOffset += newSequenceLength - oldSequenceLength
    } else if (ifAttr?.expressionValue != null) {
      const transform = transformGlassDocumentToTemplateStringPython(docSection)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }

      jsxInterpolations[pruneInterpKey] = `${transform.newDocument} if ${ifAttr.expressionValue} else ''`

      builtDoc += `\${${interpKey}}`
      doc =
        doc.substring(0, nodeStartOffset + currOffset) +
        `\${${interpKey}}` +
        doc.substring(nodeEndOffset + currOffset + updateToOffset)
      currOffset += newSequenceLength - oldSequenceLength + updateToOffset
    } else {
      // no dynamic block, but we still want to recursively evaluate the body
      const transform = transformGlassDocumentToTemplateStringPython(docSection)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }

      jsxInterpolations[pruneInterpKey] = `${transform.newDocument}`

      builtDoc += `\${${interpKey}}`
      doc =
        doc.substring(0, nodeStartOffset + currOffset) +
        `\${${interpKey}}` +
        doc.substring(nodeEndOffset + currOffset + updateToOffset)
      currOffset += newSequenceLength - oldSequenceLength + updateToOffset
    }
  }

  undeclaredSymbols.delete('GLASSVAR')
  return { doc: builtDoc, jsxInterpolations, nestedInterpolations, undeclaredSymbols: Array.from(undeclaredSymbols) }
  // return { doc, builtDoc, jsxInterpolations, nestedInterpolations, undeclaredSymbols: Array.from(undeclaredSymbols) }
}

function nestedTagHelper(currInterpolation: number, doc: string, docNode: glasslib.GlassContent) {
  let jsxInterpolations: any = {}

  if (!docNode.child?.content) {
    return { jsxInterpolations, origSection: doc, newSection: doc, undeclaredSymbols: [] }
  }

  let currOffset = 0

  const undeclaredSymbols = new Set<string>([])

  const sectionStart = docNode.position.start.offset

  let nodeInsides = docNode.child!.content

  const innerNodes = glasslib.parseGlassBlocks(nodeInsides)

  for (let i = 0; i < innerNodes.length; i++) {
    const node = innerNodes[i]

    const startOffset = node.position.start.offset
    const endOffset = node.position.end.offset

    const docSection = node.child!.content

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

    const ifAttr = node.attrs!.find(attr => attr.name === 'if')
    if (ifAttr != null) {
      if (ifAttr.stringValue != null) {
        ifAttr.expressionValue = ifAttr.stringValue
      }
    }

    if (node.tag === 'For') {
      const eachAttr = node.attrs!.find(attr => attr.name === 'each')!
      const item = node.attrs!.find(attr => attr.name === 'as')!
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
    } else {
      const transform = transformGlassDocumentToTemplateStringPython(docSection)
      for (const s of transform.undeclaredSymbols) {
        undeclaredSymbols.add(s)
      }

      jsxInterpolations[pruneInterpKey] = `${transform.newDocument}`

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

  undeclaredSymbols.delete('GLASSVAR')
  return { jsxInterpolations, origSection: doc, newSection, undeclaredSymbols: Array.from(undeclaredSymbols) }
}
