import {
  ChatBlock,
  GlassContent,
  LANGUAGE_MODELS,
  parseGlassDocument,
  reconstructGlassDocument,
} from '@glass-lang/glasslib'
import { RequestData } from '@glass-lang/glasslib/dist/parseGlassBlocks'
import { ResponseData } from '../playground/runPlayground'

const chatBlockTags = new Set(['User', 'System', 'Assistant', 'Function', 'Block'])

export function handleRequestNode(
  interpolatedDoc: string,
  request: {
    newBlockIds: string[]
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
  },
  id?: () => string
) {
  const parsedInterpolated = parseGlassDocument(interpolatedDoc)
  const newBlocks: GlassContent[] = []
  let currRequest = 0

  let idIndex = 0
  const responseBlockIds: string[] = []
  for (const block of parsedInterpolated) {
    let currId = request.newBlockIds[idIndex]
    const docId = block.attrs?.find(a => a.name === 'id')?.stringValue
    if (chatBlockTags.has(block.tag || '') && currId == null && id && !docId) {
      currId = id()
      request.newBlockIds.push(currId)
    }
    if (block.tag === 'Request') {
      if (currId != null) {
        responseBlockIds.push(currId)
      }
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
              currRequest < request.index ? false : request.streaming,
              currId
            ),
          } as any)

          if (d.functionObservation != null) {
            idIndex += 1
            let nextId = request.newBlockIds[idIndex]
            if (nextId == null && id) {
              nextId = id()
              request.newBlockIds.push(nextId)
            }
            if (nextId != null) {
              responseBlockIds.push(nextId)
            }
            newBlocks.push({
              type: 'comment',
              content: '\n\n\n', // unclear why we need 3 here, something wrong with diffing algorithm.
            } as any)
            newBlocks.push({
              tag: 'Function',
              content: `<Function name="${d.function_call!.name}"${nextId != null ? ` id="${nextId}"` : ''}>\n${
                d.functionObservation
              }\n</Function>`,
            } as any)
          }
        }
      } else {
        newBlocks.push(block)
      }
      currRequest++
    } else {
      newBlocks.push(block)
    }

    if (chatBlockTags.has(block.tag || '') && !docId) {
      idIndex += 1
    }
  }

  return {
    nextGlassfile: reconstructGlassDocument(newBlocks),
    response: convertResponseData(request.responseData, responseBlockIds, request.streaming),
  }
}

function convertResponseData(responseData: ResponseData[][], newBlockIds: string[], streaming: boolean): ChatBlock[] {
  const idIndex = 0
  const totalResponses = responseData.flat().length
  return responseData.flatMap(d =>
    d.flatMap(r => {
      const res: ChatBlock[] = []

      res.push({
        role: 'assistant',
        content: r.response + (streaming && idIndex + 1 === totalResponses ? '█' : ''),
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
  streaming: boolean,
  id?: string
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
  return `<Assistant${argAttributes}>
${response}${streaming ? '█' : ''}
</Assistant>`
}
