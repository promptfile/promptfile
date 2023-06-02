import { parseGlassBlocks, parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'

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

export function handleRequestNode(
  uninterpolatedDoc: string,
  interpolatedDoc: string,
  request: { model: string; message: string; streaming: boolean }
) {
  const parsedInterpolated = parseGlassBlocks(interpolatedDoc)
  const transcriptNode = parsedInterpolated.find(node => node.tag === 'Transcript')
  const newRequestNode = requestNodeReplacement(request.model, request.message, request.streaming)

  const userAndAssistantBlocks = parsedInterpolated.filter(block => block.tag === 'User' || block.tag === 'Assistant')

  let transcriptContent = transcriptNode?.child?.content || ''
  if (transcriptContent) {
    transcriptContent += '\n\n'
  }
  if (userAndAssistantBlocks.length > 0) {
    transcriptContent += userAndAssistantBlocks.map(block => block.content).join('\n\n')
  }
  transcriptContent += '\n\n' + newRequestNode

  return {
    nextDoc: replaceTranscriptNode('<Transcript>\n' + transcriptContent + '\n</Transcript>', uninterpolatedDoc),
    finalDoc: replaceTranscriptNode('<Transcript>\n' + transcriptContent + '\n</Transcript>', uninterpolatedDoc),
    nextInterpolatedDoc: replaceTranscriptNode(
      '<Transcript>\n' + transcriptContent + '\n</Transcript>',
      interpolatedDoc
    ),
    finalInterpolatedDoc: replaceTranscriptNode(
      '<Transcript>\n' + transcriptContent + '\n</Transcript>',
      interpolatedDoc
    ),
    rawResponse: request.streaming ? '█' : request.message,
  }
}

const requestNodeReplacement = (model: string, message: string, streaming: boolean) => {
  return `<Assistant model="${model}" temperature="1">
${message}${streaming ? '█' : ''}
</Assistant>`
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

export function replaceTranscriptNode(newTranscriptNode: string, doc: string) {
  const parsed = parseGlassDocument(doc)

  const transNode = parsed.find(node => (node as any).tag === 'Transcript')
  if (!transNode) {
    // put transcript node at the index of the first block
    const firstBlockIndex = parsed.findIndex(node => node.type === 'block')
    return addNodeToDocument(newTranscriptNode + '\n\n', firstBlockIndex, doc)
  }

  const idx = parsed.indexOf(transNode)
  return replaceDocumentNode(newTranscriptNode, idx, doc)
}
