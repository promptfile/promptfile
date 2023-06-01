import { JSXNode } from './ast'
import { removeEscapedHtml, restoreEscapedHtml } from './escapeHtml'
import { getJSXNodeInsidesString, getJSXNodeString } from './jsxElementNode'
import { parseGlassTopLevelNodes } from './parseGlassTopLevelNodes'
import { addNodeToDocument, parseGlassTopLevelNodesNext, replaceDocumentNode } from './parseGlassTopLevelNodesNext'

export function transformGlassDocument(originalDoc: string, interpolatedDoc: string) {
  const originalWithoutEscape = removeEscapedHtml(originalDoc)
  const interpolatedWithoutEscape = removeEscapedHtml(interpolatedDoc)

  originalDoc = originalWithoutEscape.output
  interpolatedDoc = interpolatedWithoutEscape.output

  const parsedOriginal = parseGlassTopLevelNodesNext(originalDoc)
  const parsedInterpolated = parseGlassTopLevelNodesNext(interpolatedDoc)

  let transformedOriginal = originalDoc
  let transformedInterpolated = interpolatedDoc

  const originalLoopNode = parsedOriginal.find(node => (node as any).tagName === 'Repeat')
  let originalLoopIndex = -1
  if (originalLoopNode) {
    originalLoopIndex = parsedOriginal.indexOf(originalLoopNode)

    const newOriginalDoc = replaceDocumentNode(
      getJSXNodeInsidesString(originalLoopNode as JSXNode, originalDoc),
      originalLoopIndex,
      originalDoc
    )

    const newDocNodes = parseGlassTopLevelNodes(newOriginalDoc)
    const nodesLengthDiff = newDocNodes.length - parsedOriginal.length

    transformedOriginal = addNodeToDocument(
      '\n' + getJSXNodeString(originalLoopNode as JSXNode, originalDoc),
      nodesLengthDiff + originalLoopIndex + 1,
      newOriginalDoc
    )
  }

  const interpolatedLoopNode = parsedInterpolated.find(node => (node as any).tagName === 'Repeat')
  let interpolatedLoopIndex = -1
  if (interpolatedLoopNode) {
    interpolatedLoopIndex = parsedInterpolated.indexOf(interpolatedLoopNode)

    const newInterpolatedDoc = replaceDocumentNode(
      getJSXNodeInsidesString(interpolatedLoopNode as JSXNode, interpolatedDoc),
      interpolatedLoopIndex,
      interpolatedDoc
    )

    const newDocNodes = parseGlassTopLevelNodes(newInterpolatedDoc)
    const nodesLengthDiff = newDocNodes.length - parsedInterpolated.length

    transformedInterpolated = addNodeToDocument(
      '\n' + getJSXNodeString(originalLoopNode as JSXNode, originalDoc),
      nodesLengthDiff + originalLoopIndex + 1,
      newInterpolatedDoc
    )
  }

  return {
    transformedOriginalDoc: restoreEscapedHtml(transformedOriginal, originalWithoutEscape.replacements),
    transformedInterpolatedDoc: restoreEscapedHtml(transformedInterpolated, interpolatedWithoutEscape.replacements),
  }
}

export function replaceStateNode(newStateNode: string, doc: string) {
  const docWithoutLiterals = removeEscapedHtml(doc)
  doc = docWithoutLiterals.output

  const parsed = parseGlassTopLevelNodesNext(doc)

  const stateNode = parsed.find(node => (node as any).tagName === 'State')
  if (!stateNode) {
    // see if the first node is a text node, if so, insert the state node after its frontmatter
    const existingFrontmatter = /---\n?([\s\S]*?)\n?---/.exec(doc)?.[1] ?? ''
    if (existingFrontmatter) {
      // find the index of the second '---\n' sequence
      const secondFrontmatterIndex = doc.indexOf('---\n', doc.indexOf('---\n') + 1)
      // return doc with the state node inserted after the second frontmatter, otherwise doc unchanged
      return secondFrontmatterIndex > -1
        ? doc.slice(0, secondFrontmatterIndex + 4) + '\n' + newStateNode + '\n' + doc.slice(secondFrontmatterIndex + 4)
        : doc
    } else {
      return addNodeToDocument(newStateNode + '\n', 0, doc)
    }
  }

  const stateIndex = parsed.indexOf(stateNode)
  const newDoc = replaceDocumentNode(newStateNode, stateIndex, doc)
  return restoreEscapedHtml(newDoc, docWithoutLiterals.replacements)
}

export function updateRequestOrChatNode(substitution: string, doc: string) {
  return replaceRequestNode(substitution, doc)
}

export function replaceRequestNode(newRequestNode: string, doc: string) {
  const docWithoutLiterals = removeEscapedHtml(doc)
  doc = docWithoutLiterals.output

  const parsed = parseGlassTopLevelNodesNext(doc)

  const requestNode = parsed.find(node => (node as any).tagName === 'Request')
  if (!requestNode) {
    return doc
  }

  const idx = parsed.indexOf(requestNode)
  const newDoc = replaceDocumentNode(newRequestNode, idx, doc)
  return restoreEscapedHtml(newDoc, docWithoutLiterals.replacements)
}
