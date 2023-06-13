import { checkOk } from '@glass-lang/util'
import fetch from 'node-fetch'
import { Readable } from 'stream'
import { LANGUAGE_MODELS, LanguageModelCreator, LanguageModelType } from './languageModels'
import { ChatCompletionRequestMessage, TokenCounter, parseChatCompletionBlocks2 } from './parseChatCompletionBlocks'
import { RequestData, parseGlassBlocks, parseGlassRequestBlock } from './parseGlassBlocks'
import { ResponseData } from './runGlass'
import { handleRequestNode } from './transformGlassDocument'

export async function runGlassV2(
  glassfile: string,
  args: Record<string, string>,
  options: {
    transcriptTokenCounter: TokenCounter
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
    output?: (line: string) => void
    ids?: bigint[]
  } = {
    transcriptTokenCounter: {
      countTokens: () => 0,
      maxTokens: () => Infinity,
    },
  }
): Promise<{
  rawResponse: string
  initDoc: string
  initInterpolatedDoc: string
  finalDoc: string
  finalInterpolatedDoc: string
}> {
  // replace initDoc instances of
  //
  // ```
  // <Chat.*>
  // (content)
  // </Chat>
  // ```
  //
  // with
  //
  // ```
  // <User>
  // (content)
  // </User>

  // eslint-disable-next-line prefer-const
  let transformedOriginalDoc = glassfile
  let transformedInterpolatedDoc = glassfile

  for (const [k, v] of Object.entries(args)) {
    // replace all instances of `${k}` with `v`
    transformedInterpolatedDoc = transformedInterpolatedDoc.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), v)
  }

  const blocks = parseGlassBlocks(transformedInterpolatedDoc)
  // const state = blocks.find(b => b.tag === 'State')?.child?.content || '{}'
  const requestBlocks = blocks.filter(b => b.tag === 'Request').map(parseGlassRequestBlock)

  // const newStateNode = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`

  // if (Object.keys(state).length > 0) {
  //   transformedOriginalDoc = replaceStateNode(newStateNode, transformedOriginalDoc)
  //   transformedInterpolatedDoc = replaceStateNode(newStateNode, transformedInterpolatedDoc)
  // }

  if (options?.progress) {
    options.progress(
      handleRequestNode(
        transformedOriginalDoc,
        transformedInterpolatedDoc,
        {
          responseData: [{ response: '' }],
          requestBlocks,
          streaming: true,
          index: 0,
        },
        options.ids
      )
    )
  }

  const responseData: ResponseData[] = []
  const messageBlocks = parseChatCompletionBlocks2(
    transformedInterpolatedDoc,
    requestBlocks,
    options?.transcriptTokenCounter
  )
  const messagesSoFar: ChatCompletionRequestMessage[] = []
  checkOk(messageBlocks.length === requestBlocks.length)

  let i = 0
  let res:
    | {
        finalDoc: string
        finalInterpolatedDoc: string
        rawResponse: string
      }
    | undefined = undefined

  for (; i < messageBlocks.length; i++) {
    const messages = messageBlocks[i]
    const requestData = requestBlocks[i]
    const model = requestData.model
    const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
    if (!languageModel) {
      throw new Error(`Language model ${model} not found`)
    }
    res =
      languageModel.creator === LanguageModelCreator.anthropic
        ? await runGlassChatAnthropic(
            messages,
            messagesSoFar,
            responseData,
            requestBlocks,
            { originalDoc: transformedOriginalDoc, interpolatedDoc: transformedInterpolatedDoc },
            options
          )
        : languageModel.type === LanguageModelType.chat
        ? await runGlassChat(
            messages,
            messagesSoFar,
            responseData,
            requestBlocks,
            { originalDoc: transformedOriginalDoc, interpolatedDoc: transformedInterpolatedDoc },
            options
          )
        : await runGlassCompletion(
            messages,
            messagesSoFar,
            responseData,
            requestBlocks,
            { originalDoc: transformedOriginalDoc, interpolatedDoc: transformedInterpolatedDoc },
            options
          )
  }

  return {
    ...res!,
    initDoc: transformedOriginalDoc,
    initInterpolatedDoc: transformedInterpolatedDoc,
  }
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChat(
  messages: ChatCompletionRequestMessage[],
  messagesSoFar: ChatCompletionRequestMessage[],
  responseData: ResponseData[],
  requestBlocks: RequestData[],
  docs: { interpolatedDoc: string; originalDoc: string },
  options: {
    transcriptTokenCounter: TokenCounter
    openaiKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
    output?: (line: string) => void
    ids?: bigint[]
  }
): Promise<{
  finalDoc: string
  finalInterpolatedDoc: string
  rawResponse: string
}> {
  const request = requestBlocks[responseData.length]

  console.log('runGlass: chat-gpt', messagesSoFar.concat(messages))
  if (options.output) {
    options.output('runGlass: chat-gpt')
    options.output(JSON.stringify(messagesSoFar.concat(messages), null, 2))
  }

  const requestTokens = options.transcriptTokenCounter.countTokens(
    messagesSoFar
      .concat(messages)
      .map(b => `<|im_start|>${b.role}\n${b.content}<|im_end|>`)
      .join(''),
    request.model
  )

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      Authorization: `Bearer ${options?.openaiKey || process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messagesSoFar.concat(messages),
      model: request.model,
      stream: true,
    }),
  })

  const response = await handleStream(r, handleChatChunk, next => {
    if (!r.ok) {
      throw new Error(`HTTP error: ${r.status}`)
    }
    // right now claude has a leading whitespace character
    // we need to remove that!
    if (options?.progress) {
      const responseTokens = options.transcriptTokenCounter.countTokens(
        `<|im_start|>assistant\n${next}<|im_end|>`,
        request.model
      )
      return options.progress(
        handleRequestNode(
          docs.originalDoc,
          docs.interpolatedDoc,
          {
            responseData: responseData.concat({ response: next.trim(), requestTokens, responseTokens }),
            requestBlocks,
            requestTokens,
            responseTokens,
            streaming: true,
            index: responseData.length,
          },
          options.ids
        )
      )
    }
  })

  const responseTokens = options.transcriptTokenCounter.countTokens(
    `<|im_start|>assistant\n${response}<|im_end|>`,
    request.model
  )

  responseData.push({ response, requestTokens, responseTokens })
  messagesSoFar.push(...messages)
  messagesSoFar.push({ role: 'assistant', content: response })

  return handleRequestNode(
    docs.originalDoc,
    docs.interpolatedDoc,
    {
      responseData,
      requestBlocks,
      requestTokens,
      responseTokens,
      streaming: false,
      index: responseData.length - 1,
    },
    options.ids
  )
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChatAnthropic(
  messages: ChatCompletionRequestMessage[],
  messagesSoFar: ChatCompletionRequestMessage[],
  responseData: ResponseData[],
  requestBlocks: RequestData[],
  docs: { interpolatedDoc: string; originalDoc: string },
  options: {
    transcriptTokenCounter: TokenCounter
    args?: any
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
    output?: (line: string) => void
    ids?: bigint[]
  }
): Promise<{
  finalDoc: string
  finalInterpolatedDoc: string
  rawResponse: string
}> {
  const request = requestBlocks[responseData.length]
  let anthropicQuery = ''
  for (const msg of messagesSoFar.concat(messages)) {
    if (msg.role === 'assistant') {
      anthropicQuery += `\n\nAssistant: ${msg.content}`
    } else if (msg.role === 'user') {
      anthropicQuery += `\n\nHuman: ${msg.content}`
    } else if (msg.role === 'system') {
      anthropicQuery += `\n\nHuman: ${msg.content}`
    } else {
      throw new Error(`Unknown role for anthropic  query: ${msg.role}`)
    }
  }
  anthropicQuery += '\n\nAssistant: '
  console.log('runGlass: anthropic', anthropicQuery)
  if (options.output) {
    options.output('runGlass: anthropic')
    options.output(anthropicQuery)
  }

  const requestTokens = options.transcriptTokenCounter.countTokens(anthropicQuery, request.model)

  const r = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      'X-API-Key': (options?.anthropicKey || process.env.ANTHROPIC_API_KEY)!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      prompt: anthropicQuery,
      max_tokens_to_sample: 2048,
      stopSequences: ['Human:', 'Assistant:'],
      stream: true,
    }),
  })

  const response = await handleStream(r, handleAnthropicChunk, next => {
    if (!r.ok) {
      throw new Error(`HTTP error: ${r.status}`)
    }
    if (options?.progress) {
      const responseTokens = options.transcriptTokenCounter.countTokens(next, request.model)
      return options.progress(
        handleRequestNode(
          docs.originalDoc,
          docs.interpolatedDoc,
          {
            responseData: responseData.concat({ response: next.trim(), requestTokens, responseTokens }),
            requestBlocks,
            requestTokens,
            responseTokens,
            streaming: true,
            index: responseData.length,
          },
          options.ids
        )
      )
    }
  })

  const responseTokens = options.transcriptTokenCounter.countTokens(response, request.model)

  responseData.push({ response: response.trim(), requestTokens, responseTokens })
  messagesSoFar.push(...messages)
  messagesSoFar.push({ role: 'assistant', content: response.trim() })

  return handleRequestNode(
    docs.originalDoc,
    docs.interpolatedDoc,
    {
      responseData,
      requestBlocks,
      streaming: false,
      requestTokens,
      responseTokens,
      index: responseData.length - 1,
    },
    options.ids
  )
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassCompletion(
  messages: ChatCompletionRequestMessage[],
  messagesSoFar: ChatCompletionRequestMessage[],
  responseData: ResponseData[],
  requestBlocks: RequestData[],
  docs: { interpolatedDoc: string; originalDoc: string },
  options: {
    transcriptTokenCounter: TokenCounter
    args?: any
    openaiKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
    output?: (line: string) => void
    ids?: bigint[]
  }
): Promise<{
  finalDoc: string
  finalInterpolatedDoc: string
  rawResponse: string
}> {
  const request = requestBlocks[responseData.length]

  const messagesToUse = messagesSoFar.concat(messages)
  const useChat = messagesToUse.length > 1

  let prompt = ''
  let stopSequence: string | null = null
  if (!useChat) {
    prompt = messagesToUse[0].content
  } else {
    stopSequence = '\n\nHuman:'
    for (const msg of messagesToUse) {
      if (msg.role === 'assistant') {
        prompt += `\n\nAssistant: ${msg.content}`
      } else if (msg.role === 'user') {
        prompt += `\n\nHuman: ${msg.content}`
      } else if (msg.role === 'system') {
        prompt += `\n\nHuman: ${msg.content}`
      } else {
        throw new Error(`Unknown role for completion query: ${msg.role}`)
      }
    }
    prompt += '\n\nAssistant: '
  }

  console.log('runGlass: gpt3', prompt)
  if (options.output) {
    options.output('runGlass: gpt3')
    options.output(prompt)
  }

  console.log({
    prompt,
    model: request.model,
    stream: true,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    stop: (request.stopSequence || []).concat(stopSequence ? [stopSequence] : []),
  })

  const requestTokens = options.transcriptTokenCounter.countTokens(prompt, request.model)
  const stop = (request.stopSequence || []).concat(stopSequence ? [stopSequence] : [])

  const r = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      Authorization: `Bearer ${options?.openaiKey || process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model: request.model,
      stream: true,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stop: stop.length ? stop : undefined,
    }),
  })

  const response = await handleStream(r, handleCompletionChunk, next => {
    if (!r.ok) {
      throw new Error(`HTTP error: ${r.status}`)
    }
    if (options?.progress) {
      const responseTokens = options.transcriptTokenCounter.countTokens(next, request.model)
      return options.progress(
        handleRequestNode(
          docs.originalDoc,
          docs.interpolatedDoc,
          {
            responseData: responseData.concat({ response: next.trim(), requestTokens, responseTokens }),
            requestBlocks,
            streaming: true,
            requestTokens,
            responseTokens,
            index: responseData.length,
          },
          options.ids
        )
      )
    }
  })

  const responseTokens = options.transcriptTokenCounter.countTokens(response, request.model)

  responseData.push({ response: response.trim(), requestTokens, responseTokens })
  messagesSoFar.push(...messages)
  messagesSoFar.push({ role: 'assistant', content: response.trim() })

  return handleRequestNode(
    docs.originalDoc,
    docs.interpolatedDoc,
    {
      responseData,
      requestBlocks,
      streaming: false,
      requestTokens,
      responseTokens,
      index: responseData.length - 1,
    },
    options.ids
  )
}

async function handleStream(
  r: any,
  processChunk: (currResult: string, eventData: any) => string,
  progress: (nextVal: string) => void
) {
  if (!r.ok) {
    throw new Error(`HTTP error: ${r.status}`)
  }

  if (!r.headers.get('content-type').startsWith('text/event-stream')) {
    throw new Error(`Expected "text/event-stream" content type, but received "${r.headers.get('content-type')}"`)
  }

  let fullResult = ''
  const decoder = new TextDecoder()

  let buffer = ''

  await new Promise((resolve, reject) => {
    const readStream = new Readable().wrap(r.body as any)

    readStream.on('data', chunk => {
      const lines = decoder.decode(chunk).split('\n')

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const content = line.slice('data:'.length).trim()
          if (content === '[DONE]') {
            return
          }
          buffer = content
          try {
            const eventData = JSON.parse(buffer)
            fullResult = processChunk(fullResult, eventData)
            progress(fullResult)
            buffer = ''
          } catch (e) {
            // ignore
          }
        } else if (buffer !== '') {
          buffer += line
          try {
            const eventData = JSON.parse(buffer)
            fullResult = processChunk(fullResult, eventData)
            progress(fullResult)
            buffer = ''
          } catch (e) {
            // ignore
          }
        }
      }
    })

    readStream.on('end', () => {
      resolve(fullResult)
    })

    readStream.on('error', error => {
      reject(error)
    })
  })

  return fullResult
}

function handleChatChunk(currResult: string, eventData: { choices: { delta: { content: string } }[] }) {
  if (eventData.choices[0].delta.content) {
    const newResult = currResult + eventData.choices[0].delta.content
    return newResult
  }
  return currResult
}

function handleAnthropicChunk(currResult: string, eventData: { completion: string }) {
  if (eventData.completion) {
    return eventData.completion
  }
  return currResult
}

function handleCompletionChunk(currResult: string, eventData: { choices: { text: string }[] }) {
  if (eventData.choices[0].text) {
    const newResult = currResult + eventData.choices[0].text
    return newResult
  }
  return currResult
}
