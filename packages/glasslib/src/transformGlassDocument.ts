import { GlassContent, parseGlassBlocks, parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'
import { RequestData } from './runGlass'

export function addNodeToDocument(content: string, index: number, doc: string, replaceOnceNodes = false) {
  const parsed = parseGlassDocument(doc)
  const nodes = parsed
    .slice(0, index)
    .concat({ content, type: 'block' } as any)
    .concat(parsed.slice(index))
    .filter(b => (replaceOnceNodes ? !isOnceBlock(b) : true))
  return reconstructGlassDocument(nodes)
}

export function replaceDocumentNode(content: string, index: number, doc: string, replaceOnceNodes = false) {
  const parsed = parseGlassDocument(doc)
  const nodes = parsed
    .slice(0, index)
    .concat({ content, type: 'block' } as any)
    .concat(parsed.slice(index + 1))
    .filter(b => (replaceOnceNodes ? !isOnceBlock(b) : true))
  return reconstructGlassDocument(nodes)
}

function isOnceBlock(block: GlassContent) {
  const onceAttr = block.attrs?.find(attr => attr.name === 'once')
  return (
    onceAttr &&
    ((onceAttr.stringValue == null && onceAttr.expressionValue == null) ||
      onceAttr.stringValue?.toLowerCase() === 'true' ||
      onceAttr?.expressionValue?.toLowerCase() === '"true"' ||
      onceAttr?.expressionValue?.toLowerCase() === 'true' ||
      onceAttr?.expressionValue?.toLowerCase() === "'true'")
  )
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

export function addToTranscript(
  addToTranscript: { tag: string; content: string }[],
  doc: string,
  interpolatedDoc: string
) {
  const parsedDoc = parseGlassDocument(doc)
  const transcriptNodeDoc = parsedDoc.find(node => node.tag === 'Transcript')
  const newDocTranscript =
    '<Transcript>\n' +
    (transcriptNodeDoc?.child?.content || '') +
    '\n\n' +
    addToTranscript.map(block => `<${block.tag}>\n${block.content}\n</${block.tag}>`).join('\n\n') +
    '\n</Transcript>'

  const parsedInterpolated = parseGlassDocument(interpolatedDoc)
  const transcriptNode = parsedInterpolated.find(node => node.tag === 'Transcript')
  const newInterpolatedTranscript =
    '<Transcript>\n' +
    (transcriptNode?.child?.content || '') +
    '\n\n' +
    addToTranscript.map(block => `<${block.tag}>\n${block.content}\n</${block.tag}>`).join('\n\n') +
    '\n</Transcript>'

  return {
    doc: replaceTranscriptNode(newDocTranscript, doc, false),
    interpolatedDoc: replaceTranscriptNode(newInterpolatedTranscript, interpolatedDoc, false),
  }
}

export function addToDocument(
  addToDocument: { tag: string; content: string; attrs?: any }[],
  doc: string,
  interpolatedDoc: string
) {
  const bs = addToDocument
    .map(b => {
      const attrs = b.attrs
        ? ` ${Object.keys(b.attrs)
            .map(k => `${k}={${JSON.stringify(b.attrs[k])}}`)
            .join(' ')}`
        : ''
      return `<${b.tag}${attrs}>\n${b.content}\n</${b.tag}>`
    })
    .join('\n\n')

  const parsedDoc = parseGlassDocument(doc)
  const transcriptNodeDoc = parsedDoc.find(node => node.tag === 'Transcript')
  const transcriptNodeIndex = parsedDoc.indexOf(transcriptNodeDoc!)

  const parsedInterpolated = parseGlassDocument(interpolatedDoc)
  const transcriptInterpNode = parsedInterpolated.find(node => node.tag === 'Transcript')
  const transcriptNodeInterpIndex = parsedDoc.indexOf(transcriptInterpNode!)

  return {
    doc: addNodeToDocument('\n\n' + bs + '\n\n', transcriptNodeIndex + 1, doc),
    interpolatedDoc: addNodeToDocument('\n\n' + bs + '\n\n', transcriptNodeInterpIndex + 1, interpolatedDoc),
  }
}

export function handleRequestNode(
  uninterpolatedDoc: string,
  interpolatedDoc: string,
  request: {
    requestBlocks: RequestData[]
    messages: string[]
    streaming: boolean
    requestTokens?: number
    responseTokens?: number
    index: number
  }
) {
  const parsedInterpolated = parseGlassBlocks(interpolatedDoc)
  const transcriptNode = parsedInterpolated.find(node => node.tag === 'Transcript')
  const newRequestNode = requestNodeReplacement(
    request.requestBlocks[request.index].model,
    request.messages[request.messages.length - 1],
    request.streaming,
    {
      requestTokens: request.requestTokens,
      responseTokens: request.responseTokens,
    }
  )

  const userAndAssistantBlocks: GlassContent[] = []
  let currRequest = 0
  for (const block of parsedInterpolated) {
    if (block.tag === 'Request') {
      const model = request.requestBlocks[currRequest].model
      if (currRequest < request.index && request.messages[currRequest] != null) {
        userAndAssistantBlocks.push({
          tag: 'Assistant',
          content: requestNodeReplacement(model, request.messages[currRequest], false),
        } as any)
      }
      currRequest++
      if (currRequest > request.index) {
        break
      }
    }
    if (block.tag === 'User' || block.tag === 'Assistant') {
      const transcriptAttr = block.attrs?.find(attr => attr.name === 'transcript')
      if (
        transcriptAttr &&
        (transcriptAttr.stringValue?.toLowerCase() === 'false' ||
          transcriptAttr.expressionValue?.toLowerCase() === 'false')
      ) {
        // ignore
      } else {
        userAndAssistantBlocks.push(block)
      }
    }
  }

  let transcriptContent = transcriptNode?.child?.content || ''
  if (transcriptContent) {
    transcriptContent += '\n\n'
  }
  if (userAndAssistantBlocks.length > 0) {
    transcriptContent += userAndAssistantBlocks.map(block => block.content).join('\n\n')
  }
  transcriptContent += (transcriptContent.length ? '\n\n' : '') + newRequestNode

  return {
    nextDoc: replaceTranscriptNode('<Transcript>\n' + transcriptContent + '\n</Transcript>', uninterpolatedDoc, true),
    finalDoc: replaceTranscriptNode('<Transcript>\n' + transcriptContent + '\n</Transcript>', uninterpolatedDoc, true),
    nextInterpolatedDoc: replaceTranscriptNode(
      '<Transcript>\n' + transcriptContent + '\n</Transcript>',
      interpolatedDoc,
      true
    ),
    finalInterpolatedDoc: replaceTranscriptNode(
      '<Transcript>\n' + transcriptContent + '\n</Transcript>',
      interpolatedDoc,
      true
    ),
    rawResponse: request.streaming ? '█' : request.messages[request.messages.length - 1],
  }
}

const requestNodeReplacement = (
  model: string,
  message: string,
  streaming: boolean,
  tokens?: { requestTokens?: number; responseTokens?: number }
) => {
  const args: Record<string, string> = {
    model,
    temperature: '1',
  }
  if (tokens?.requestTokens) {
    args.requestTokens = tokens.requestTokens.toString()
  }
  if (tokens?.responseTokens) {
    args.responseTokens = tokens.responseTokens.toString()
  }
  const argAttributes: string = Object.entries(args).reduce((acc, [key, value]) => {
    return acc + ` ${key}="${value}"`
  }, '')
  return `<Assistant${argAttributes}>
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

export function replaceTranscriptNode(newTranscriptNode: string, doc: string, replaceOnceNodes = false) {
  const parsed = parseGlassDocument(doc)

  const transNode = parsed.find(node => (node as any).tag === 'Transcript')
  if (!transNode) {
    // put transcript node at the index of the first non-state/test block
    const firstBlockIndex = parsed.findIndex(
      node => node.type === 'block' && node.tag !== 'State' && node.tag !== 'Test'
    )
    return addNodeToDocument(newTranscriptNode + '\n\n', firstBlockIndex, doc, replaceOnceNodes)
  }

  const idx = parsed.indexOf(transNode)
  return replaceDocumentNode(newTranscriptNode, idx, doc, replaceOnceNodes)
}
