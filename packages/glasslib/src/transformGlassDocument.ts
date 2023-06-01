import { parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'

export function addNodeToDocument(content: string, index: number, doc: string) {
  const parsed: { content: string; type: string }[] = parseGlassDocument(doc)
  const nodes = parsed.slice(0, index).concat({ content, type: 'block' }).concat(parsed.slice(index))
  return reconstructGlassDocument(nodes)
}

export function replaceDocumentNode(content: string, index: number, doc: string) {
  const parsed: { content: string; type: string }[] = parseGlassDocument(doc)
  const nodes = parsed
    .slice(0, index)
    .concat({ content, type: 'block' })
    .concat(parsed.slice(index + 1))
  return reconstructGlassDocument(nodes)
}

export function transformGlassDocument(originalDoc: string, interpolatedDoc: string) {
  const parsedOriginal = parseGlassDocument(originalDoc)
  const parsedInterpolated = parseGlassDocument(interpolatedDoc)

  let transformedOriginal = originalDoc
  let transformedInterpolated = interpolatedDoc

  const originalLoopNode = parsedOriginal.find(node => (node as any).tag === 'Repeat')
  const interpolatedLoopNode = parsedInterpolated.find(node => (node as any).tag === 'Repeat')
  const originalLoopIndex = parsedOriginal.indexOf(originalLoopNode || (null as any))
  const interpolatedLoopIndex = parsedInterpolated.indexOf(interpolatedLoopNode || (null as any))
  if (originalLoopNode && interpolatedLoopNode) {
    const newOriginalDoc = replaceDocumentNode(
      interpolatedLoopNode.child!.content,
      interpolatedLoopIndex,
      interpolatedDoc
    )

    const newDocNodes = parseGlassDocument(newOriginalDoc)
    const nodesLengthDiff = newDocNodes.length - parsedOriginal.length

    transformedOriginal = addNodeToDocument(
      '\n\n' + originalLoopNode.content + '\n',
      nodesLengthDiff + originalLoopIndex + 1,
      newOriginalDoc
    )
  }

  if (originalLoopNode && interpolatedLoopNode) {
    const newInterpolatedDoc = replaceDocumentNode(
      interpolatedLoopNode.child!.content,
      interpolatedLoopIndex,
      interpolatedDoc
    )
    // const newInterpolatedDoc = replaceDocumentNode(
    //   getJSXNodeInsidesString((interpolatedLoopNode as any).child.content, interpolatedDoc),
    //   interpolatedLoopIndex,
    //   interpolatedDoc
    // )

    const newDocNodes = parseGlassDocument(newInterpolatedDoc)
    const nodesLengthDiff = newDocNodes.length - parsedInterpolated.length

    transformedInterpolated = addNodeToDocument(
      '\n\n' + originalLoopNode!.content,
      nodesLengthDiff + originalLoopIndex + 1,
      newInterpolatedDoc
    )
  }

  return {
    transformedOriginalDoc: transformedOriginal,
    transformedInterpolatedDoc: transformedInterpolated,
  }
}

export function replaceStateNode(newStateNode: string, doc: string) {
  const parsed = parseGlassDocument(doc)

  const stateNode = parsed.find(node => (node as any).tag === 'State')
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
      return addNodeToDocument(newStateNode + '\n' + '\n', 0, doc)
    }
  }

  const stateIndex = parsed.indexOf(stateNode)
  return replaceDocumentNode(newStateNode, stateIndex, doc)
}

export function updateRequestOrChatNode(substitution: string, doc: string) {
  return replaceRequestNode(substitution, doc)
}

export function replaceRequestNode(newRequestNode: string, doc: string) {
  const parsed = parseGlassDocument(doc)

  const requestNode = parsed.find(node => (node as any).tag === 'Request')
  if (!requestNode) {
    return doc
  }

  const idx = parsed.indexOf(requestNode)
  return replaceDocumentNode(newRequestNode, idx, doc)
}

export function updateChatNode(chatNodeSubstitution: string, doc: string) {
  const parsed = parseGlassDocument(doc)

  const chatNode = parsed.find(node => (node as any).tag === 'Chat')
  if (!chatNode) {
    return doc
  }

  const idx = parsed.indexOf(chatNode)
  const newDoc = addNodeToDocument(chatNodeSubstitution, idx, doc)
  // remove all instances of initialRole="assistant"
  return newDoc
    .replace(/initialRole="(assistant|user|Assistant|User)"/g, '')
    .replace(/initialRole={"(assistant|user|Assistant|User)"}/g, '')
    .replace(/initialRole={'(assistant|user|Assistant|User)'}/g, '')
    .replace(/initialRole={`(assistant|user|Assistant|User)`}/g, '')
}
