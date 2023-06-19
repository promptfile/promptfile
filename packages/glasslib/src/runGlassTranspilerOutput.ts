import { checkOk } from '@glass-lang/util'
import fetch from 'node-fetch'
import { Readable } from 'stream'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { LANGUAGE_MODELS, LanguageModelCreator, LanguageModelType } from './languageModels'
import { parseChatBlocks2 } from './parseChatBlocks'
import { FunctionData, RequestData } from './parseGlassBlocks'
import { DEFAULT_TOKEN_COUNTER, TokenCounter } from './tokenCounter'
import { addToDocument, handleRequestNode, replaceStateNode } from './transformGlassDocument'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
}

interface LLMResponse {
  content: string
  function_call?: { name: string; arguments: string } | null
}

export interface ResponseData {
  response: string
  function_call?: { name: string; arguments: string } | null
  functionObservation?: string
  requestTokens?: number
  responseTokens?: number
}

export interface TranspilerOutput {
  fileName: string
  interpolatedDoc: string
  originalDoc: string
  state: any
  interpolationArgs: any
  requestBlocks: RequestData[]
  functions: FunctionData[]
}

export async function runGlassTranspilerOutput(
  { fileName, originalDoc, interpolatedDoc, state, requestBlocks, functions, interpolationArgs }: TranspilerOutput,
  options: {
    tokenCounter?: TokenCounter
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatCompletionRequestMessage[] }) => void
    output?: (line: string) => void
  } = {}
): Promise<{
  response: ChatCompletionRequestMessage[]
  nextGlassfile: string
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

  let transformedInterpolatedDoc = interpolatedDoc

  const newStateNode = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`

  if (Object.keys(state).length > 0) {
    transformedInterpolatedDoc = replaceStateNode(newStateNode, transformedInterpolatedDoc)
  }

  if (options?.progress) {
    options.progress(
      handleRequestNode(transformedInterpolatedDoc, {
        responseData: [[{ response: '' }]],
        requestBlocks,
        streaming: true,
        index: 0,
      })
    )
  }

  const responseData: ResponseData[][] = []
  const messageBlocks = parseChatBlocks2(transformedInterpolatedDoc, requestBlocks, options?.tokenCounter)
  const messagesSoFar: ChatCompletionRequestMessage[] = []
  checkOk(messageBlocks.length === requestBlocks.length)

  let i = 0
  let res:
    | {
        response: ChatCompletionRequestMessage[]
        nextGlassfile: string
      }
    | undefined = undefined
  let codeResponse: any
  let continued = false

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
            transformedInterpolatedDoc,
            options
          )
        : languageModel.type === LanguageModelType.chat
        ? await runGlassChat(
            messages,
            messagesSoFar,
            responseData,
            requestBlocks,
            functions,
            transformedInterpolatedDoc,
            i,
            options
          )
        : await runGlassCompletion(
            messages,
            messagesSoFar,
            responseData,
            requestBlocks,
            transformedInterpolatedDoc,
            options
          )

    const blocksToAddToDocument: { tag: string; content: string; attrs?: any }[] = []

    if (requestData.onResponse) {
      const lastResponse = res.response[res.response.length - 1]
      await requestData.onResponse({
        message: lastResponse.content,
        addToDocument: (tag: string, content: string, attrs?: any) => {
          blocksToAddToDocument.push({ tag, content, attrs })
        },
        continue: () => {
          continued = true
        },
      })
      if (Object.keys(state).length > 0) {
        const finalStateBlock = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`
        res.nextGlassfile = replaceStateNode(finalStateBlock, res.nextGlassfile)
      }
    }

    if (blocksToAddToDocument.length > 0) {
      const added = addToDocument(blocksToAddToDocument, res.nextGlassfile)
      res.nextGlassfile = added.doc
    }
  }

  return res!
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChat(
  messages: ChatCompletionRequestMessage[],
  messagesSoFar: ChatCompletionRequestMessage[],
  responseData: ResponseData[][],
  requestBlocks: RequestData[],
  functions: FunctionData[],
  interpolatedDoc: string,
  responseIndex: number,
  options: {
    tokenCounter?: TokenCounter
    openaiKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatCompletionRequestMessage[] }) => void
    output?: (line: string) => void
  }
): Promise<{
  response: ChatCompletionRequestMessage[]
  nextGlassfile: string
}> {
  const request = requestBlocks[responseIndex]
  const responseDataToAppendTo = responseData[responseIndex] // if undefined, starting new response data

  console.log('runGlass: chat-gpt', messagesSoFar.concat(messages))
  if (options.output) {
    options.output('runGlass: chat-gpt')
    options.output(JSON.stringify(messagesSoFar.concat(messages), null, 2))
  }

  const tokenCounter = options.tokenCounter || DEFAULT_TOKEN_COUNTER

  const requestTokens = tokenCounter.countTokens(
    messagesSoFar
      .concat(messages)
      .map(b => `<|im_start|>${b.role}\n${b.content}<|im_end|>`)
      .join(''),
    request.model
  )

  let functionArgs = {}
  if (functions.length > 0) {
    functionArgs = {
      functions: functions.map(f => ({
        name: f.name,
        description: f.description,
        parameters: (zodToJsonSchema(f.schema, f.name) as any).definitions[f.name],
      })),
      function_call: 'auto',
    }
  }

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
      ...functionArgs,
    }),
  })

  const response = await handleStream(r, handleChatChunk, next => {
    if (!r.ok) {
      throw new Error(`HTTP error: ${r.status}`)
    }
    if (options?.progress) {
      const responseTokens = tokenCounter.countTokens(`<|im_start|>assistant\n${next}<|im_end|>`, request.model)
      return options.progress(
        handleRequestNode(interpolatedDoc, {
          responseData:
            responseDataToAppendTo == null
              ? responseData.concat([
                  [
                    {
                      response: next.content.trim(),
                      function_call: next.function_call,
                      requestTokens,
                      responseTokens,
                    },
                  ],
                ])
              : responseData.map((r, i) =>
                  i === responseIndex
                    ? r.concat([
                        {
                          response: next.content.trim(),
                          function_call: next.function_call,
                          requestTokens,
                          responseTokens,
                        },
                      ])
                    : r
                ),
          requestBlocks,
          requestTokens,
          responseTokens,
          streaming: true,
          index: responseData.length,
        })
      )
    }
  })

  let functionObservation: string | undefined = undefined
  if (response.function_call != null) {
    const fn = functions.find(f => f.name === response.function_call!.name)
    checkOk(fn, `Function ${response.function_call!.name} not found`)
    const args = fn.schema.parse(JSON.parse(response.function_call!.arguments))
    const result = await fn.run(args)
    functionObservation = JSON.stringify(result, null, 2)
  }

  // TODO: handle counting tokens for function response
  const responseTokens = tokenCounter.countTokens(`<|im_start|>assistant\n${response.content}<|im_end|>`, request.model)

  if (responseDataToAppendTo == null) {
    responseData.push([
      {
        response: response.content.trim(),
        function_call: response.function_call,
        functionObservation,
        requestTokens,
        responseTokens,
      },
    ])
  } else {
    responseData[responseIndex].push({
      response: response.content.trim(),
      function_call: response.function_call,
      functionObservation,
      requestTokens,
      responseTokens,
    })
  }
  messagesSoFar.push(...messages)
  messagesSoFar.push({
    role: 'assistant',
    content: response.content.trim().length ? response.content.trim() : JSON.stringify(response.function_call, null, 2),
  })

  if (functionObservation) {
    messagesSoFar.push({
      role: 'function',
      content: functionObservation,
      name: response.function_call!.name,
    })

    return await runGlassChat(
      [],
      messagesSoFar,
      responseData,
      requestBlocks,
      functions,
      interpolatedDoc,
      responseIndex, // don't increment, gotta continue
      options
    )
  }

  return handleRequestNode(interpolatedDoc, {
    responseData,
    requestBlocks,
    requestTokens,
    responseTokens,
    streaming: false,
    index: responseData.length - 1,
  })
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChatAnthropic(
  messages: ChatCompletionRequestMessage[],
  messagesSoFar: ChatCompletionRequestMessage[],
  responseData: ResponseData[][],
  requestBlocks: RequestData[],
  interpolatedDoc: string,
  options: {
    tokenCounter?: TokenCounter
    args?: any
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatCompletionRequestMessage[] }) => void
    output?: (line: string) => void
  }
): Promise<{
  response: ChatCompletionRequestMessage[]
  nextGlassfile: string
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

  const tokenCounter = options.tokenCounter || DEFAULT_TOKEN_COUNTER

  const requestTokens = tokenCounter.countTokens(anthropicQuery, request.model)

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
      const responseTokens = tokenCounter.countTokens(next.content, request.model)
      return options.progress(
        handleRequestNode(interpolatedDoc, {
          responseData: responseData.concat([[{ response: next.content.trim(), requestTokens, responseTokens }]]),
          requestBlocks,
          requestTokens,
          responseTokens,
          streaming: true,
          index: responseData.length,
        })
      )
    }
  })

  const responseTokens = tokenCounter.countTokens(response.content, request.model)

  responseData.push([{ response: response.content.trim(), requestTokens, responseTokens }])
  messagesSoFar.push(...messages)
  messagesSoFar.push({ role: 'assistant', content: response.content.trim() })

  return handleRequestNode(interpolatedDoc, {
    responseData,
    requestBlocks,
    streaming: false,
    requestTokens,
    responseTokens,
    index: responseData.length - 1,
  })
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassCompletion(
  messages: ChatCompletionRequestMessage[],
  messagesSoFar: ChatCompletionRequestMessage[],
  responseData: ResponseData[][],
  requestBlocks: RequestData[],
  interpolatedDoc: string,
  options: {
    tokenCounter?: TokenCounter
    args?: any
    openaiKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatCompletionRequestMessage[] }) => void
    output?: (line: string) => void
  }
): Promise<{
  response: ChatCompletionRequestMessage[]
  nextGlassfile: string
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

  const tokenCounter = options.tokenCounter || DEFAULT_TOKEN_COUNTER

  const requestTokens = tokenCounter.countTokens(prompt, request.model)
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
      const responseTokens = tokenCounter.countTokens(next.content, request.model)
      return options.progress(
        handleRequestNode(interpolatedDoc, {
          responseData: responseData.concat([[{ response: next.content.trim(), requestTokens, responseTokens }]]),
          requestBlocks,
          streaming: true,
          requestTokens,
          responseTokens,
          index: responseData.length,
        })
      )
    }
  })

  const responseTokens = tokenCounter.countTokens(response.content, request.model)

  responseData.push([{ response: response.content.trim(), requestTokens, responseTokens }])
  messagesSoFar.push(...messages)
  messagesSoFar.push({ role: 'assistant', content: response.content.trim() })

  return handleRequestNode(interpolatedDoc, {
    responseData,
    requestBlocks,
    streaming: false,
    requestTokens,
    responseTokens,
    index: responseData.length - 1,
  })
}

async function handleStream(
  r: any,
  processChunk: (currResult: LLMResponse, eventData: any) => LLMResponse,
  progress: (nextVal: LLMResponse) => void
) {
  if (!r.ok) {
    throw new Error(`HTTP error: ${r.status}`)
  }

  if (!r.headers.get('content-type').startsWith('text/event-stream')) {
    throw new Error(`Expected "text/event-stream" content type, but received "${r.headers.get('content-type')}"`)
  }

  let fullResult: LLMResponse = { content: '' }
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

function handleChatChunk(
  currResult: LLMResponse,
  eventData: {
    choices: {
      delta: {
        content: string | null
        function_call: {
          name: string
          arguments: string
        }
      }
    }[]
  }
) {
  const choice = eventData.choices[0]
  if (choice.delta.function_call) {
    const newResult: LLMResponse = { ...currResult }
    if (!newResult.function_call) {
      newResult.function_call = {
        name: '',
        arguments: '',
      }
    }
    if (choice.delta.function_call.name) {
      newResult.function_call.name = choice.delta.function_call.name
    }
    if (choice.delta.function_call.arguments) {
      newResult.function_call.arguments += choice.delta.function_call.arguments
    }
    return newResult
  }
  if (eventData.choices[0].delta.content) {
    const newResult = { ...currResult }
    newResult.content += eventData.choices[0].delta.content
    return newResult
  }
  return currResult
}

function handleAnthropicChunk(currResult: LLMResponse, eventData: { completion: string }) {
  if (eventData.completion) {
    return { content: eventData.completion }
  }
  return currResult
}

function handleCompletionChunk(currResult: LLMResponse, eventData: { choices: { text: string }[] }) {
  if (eventData.choices[0].text) {
    const newResult = { ...currResult }
    newResult.content += eventData.choices[0].text
    return newResult
  }
  return currResult
}
