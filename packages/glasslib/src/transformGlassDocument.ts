import { LANGUAGE_MODELS } from './languageModels'
import { ChatCompletionRequestMessage } from './parseChatCompletionBlocks'
import { GlassContent, RequestData, parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'
import { ResponseData } from './runGlassTranspilerOutput'

export function addNodeToDocument(content: string, index: number, doc: string) {
  const parsed = parseGlassDocument(doc)
  const nodes = parsed
    .slice(0, index)
    .concat({ content, type: 'block' } as any)
    .concat(parsed.slice(index))
  return reconstructGlassDocument(nodes)
}

export function replaceDocumentNode(content: string, index: number, doc: string) {
  const parsed = parseGlassDocument(doc)
  const nodes = parsed
    .slice(0, index)
    .concat({ content, type: 'block' } as any)
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

export function addToDocument(addToDocument: { tag: string; content: string; attrs?: any }[], doc: string) {
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

  return {
    doc: addNodeToDocument('\n\n' + bs + '\n\n', transcriptNodeIndex + 1, doc),
  }
}

export function handleRequestNode(
  interpolatedDoc: string,
  request: {
    requestBlocks: RequestData[]
    responseData: {
      response: string
      function_call?: { name: string; arguments: string } | null
      functionObservation?: string
      requestTokens?: number
      responseTokens?: number
    }[][]
    streaming: boolean
    requestTokens?: number
    responseTokens?: number
    index: number
  }
) {
  const parsedInterpolated = parseGlassDocument(interpolatedDoc)
  const newBlocks: GlassContent[] = []
  let currRequest = 0

  for (const block of parsedInterpolated) {
    if (block.tag === 'Request') {
      if (request.responseData[currRequest]?.length) {
        for (let i = 0; i < request.responseData[currRequest].length; i++) {
          const d = request.responseData[currRequest][i]
          if (i > 0) {
            // add block separation for multiple responses
            newBlocks.push({
              type: 'comment',
              content: '\n\n',
            } as any)
          }
          newBlocks.push({
            tag: 'Assistant',
            content: requestNodeReplacement(
              request.requestBlocks[currRequest],
              d,
              currRequest < request.index ? false : request.streaming
            ),
          } as any)
        }
      } else {
        newBlocks.push(block)
      }
      currRequest++
    } else {
      newBlocks.push(block)
    }
  }

  // const lastRequest = request.responseData[request.responseData.length - 1]
  // let response =
  //   lastRequest.function_call != null ? JSON.stringify(lastRequest.function_call, null, 2) : lastRequest.response
  // if (request.streaming) {
  //   response += '█'
  // }

  return {
    nextGlassfile: reconstructGlassDocument(newBlocks),
    response: convertResponseData(request.responseData),
  }
}

function convertResponseData(responseData: ResponseData[][]): ChatCompletionRequestMessage[] {
  return responseData.flatMap(d =>
    d.flatMap(r => {
      const res: ChatCompletionRequestMessage[] = []

      res.push({
        role: 'assistant',
        content: r.response,
        type: r.function_call != null ? 'function_call' : undefined,
      })

      if (r.function_call != null && r.functionObservation != null) {
        res.push({
          role: 'function',
          content: r.functionObservation,
          name: r.function_call!.name,
        })
      }

      return res
    })
  )
}

const requestNodeReplacement = (
  request: RequestData,
  responseData: {
    response: string
    function_call?: { name: string; arguments: string } | null
    functionObservation?: string
    requestTokens?: number
    responseTokens?: number
  },
  streaming: boolean
) => {
  const args: Record<string, any> = {
    model: request.model,
    temperature: request.temperature != null ? request.temperature : 1,
  }
  const model = LANGUAGE_MODELS.find(m => m.name === request.model)
  if (request.maxTokens != null) {
    args.maxTokens = request.maxTokens
  }
  if (request.stopSequence != null) {
    args.stopSequence = request.stopSequence
  }
  // let cost = 0
  // if (responseData.requestTokens) {
  //   args.requestTokens = responseData.requestTokens
  //   cost += model!.costPrompt(responseData.requestTokens)
  // }
  // if (responseData.responseTokens) {
  //   args.responseTokens = responseData.responseTokens
  //   cost += model!.costCompletion(responseData.responseTokens)
  // }
  // if (cost !== 0) {
  //   args.cost = cost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 5 })
  // }

  const response =
    responseData.function_call != null ? JSON.stringify(responseData.function_call, null, 2) : responseData.response

  if (responseData.function_call != null) {
    args.type = 'function_call'
  }

  const argAttributes: string = Object.entries(args).reduce((acc, [key, value]) => {
    return acc + ` ${key}=${typeof value === 'string' ? `"${value}"` : `{${JSON.stringify(value)}}`}`
  }, '')
  return (
    `<Assistant${argAttributes}>
${response}${streaming ? '█' : ''}
</Assistant>` +
    (responseData.functionObservation
      ? `\n\n<Function name="${responseData.function_call!.name}">\n${responseData.functionObservation}\n</Function>`
      : '')
  )
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
