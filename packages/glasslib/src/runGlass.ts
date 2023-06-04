import fetch from 'node-fetch'
import { Readable } from 'stream'
import { LANGUAGE_MODELS, LanguageModelCreator, LanguageModelType } from './languageModels'
import { parseChatCompletionBlocks, parseChatCompletionBlocks2 } from './parseChatCompletionBlocks'
import { addToDocument, addToTranscript, handleRequestNode, replaceStateNode } from './transformGlassDocument'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface TranspilerOutput {
  fileName: string
  model: string
  interpolatedDoc: string
  originalDoc: string
  state: any
  interpolationArgs: any
  onResponse?: (data: {
    message: string
    addToTranscript: (tag: string, content: string) => void
    addToDocument: (tag: string, content: string, attrs?: any) => void
    continue: () => void
  }) => Promise<any>
}

export async function runGlass(
  { fileName, model, originalDoc, interpolatedDoc, state, onResponse, interpolationArgs }: TranspilerOutput,
  options?: {
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
  }
): Promise<{
  rawResponse: string
  codeResponse?: any
  initDoc: string
  initInterpolatedDoc: string
  finalDoc: string
  finalInterpolatedDoc: string
  continued: boolean
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
  let transformedOriginalDoc = originalDoc
  let transformedInterpolatedDoc = interpolatedDoc

  const newStateNode = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`

  if (Object.keys(state).length > 0) {
    transformedOriginalDoc = replaceStateNode(newStateNode, transformedOriginalDoc)
    transformedInterpolatedDoc = replaceStateNode(newStateNode, transformedInterpolatedDoc)
  }

  if (options?.progress) {
    options.progress(
      handleRequestNode(transformedOriginalDoc, transformedInterpolatedDoc, {
        messages: [''],
        model,
        streaming: true,
        index: 0,
      })
    )
  }
  const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
  if (!languageModel) {
    throw new Error(`Language model ${model} not found`)
  }
  const res =
    languageModel.creator === LanguageModelCreator.anthropic
      ? await runGlassChatAnthropic(
          fileName,
          model,
          interpolationArgs,
          { originalDoc: transformedOriginalDoc, interpolatedDoc: transformedInterpolatedDoc },
          options
        )
      : languageModel.type === LanguageModelType.chat
      ? await runGlassChat(
          fileName,
          model,
          interpolationArgs,
          { originalDoc: transformedOriginalDoc, interpolatedDoc: transformedInterpolatedDoc },
          options
        )
      : await runGlassCompletion(
          fileName,
          model as any,
          interpolationArgs,
          { originalDoc: transformedOriginalDoc, interpolatedDoc: transformedInterpolatedDoc },
          options
        )

  let codeResponse: any = undefined

  const blocksToAdd: { tag: string; content: string }[] = []
  const blocksToAddToDocument: { tag: string; content: string; attrs?: any }[] = []
  let continued = false

  if (onResponse) {
    codeResponse = await onResponse({
      message: res.rawResponse,
      addToTranscript: (tag: string, content: string) => {
        blocksToAdd.push({ tag, content })
      },
      addToDocument: (tag: string, content: string, attrs?: any) => {
        blocksToAddToDocument.push({ tag, content, attrs })
      },
      continue: () => {
        continued = true
      },
    })
    if (Object.keys(state).length > 0) {
      const finalStateBlock = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`
      res.finalDoc = replaceStateNode(finalStateBlock, res.finalDoc)
      res.finalInterpolatedDoc = replaceStateNode(finalStateBlock, res.finalInterpolatedDoc)
    }
  }

  if (blocksToAdd.length > 0) {
    const added = addToTranscript(blocksToAdd, res.finalDoc, res.finalInterpolatedDoc)
    res.finalDoc = added.doc
    res.finalInterpolatedDoc = added.interpolatedDoc
  }

  if (blocksToAddToDocument.length > 0) {
    const added = addToDocument(blocksToAddToDocument, res.finalDoc, res.finalInterpolatedDoc)
    res.finalDoc = added.doc
    res.finalInterpolatedDoc = added.interpolatedDoc
  }

  return {
    ...res,
    initDoc: transformedOriginalDoc,
    initInterpolatedDoc: transformedInterpolatedDoc,
    codeResponse,
    continued,
  }
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChat(
  fileName: string,
  model: string,
  interpolationArgs: any,
  docs: { interpolatedDoc: string; originalDoc: string },
  options?: {
    openaiKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
  }
): Promise<{
  finalDoc: string
  finalInterpolatedDoc: string
  rawResponse: string
}> {
  const messageBlocks = parseChatCompletionBlocks2(docs.interpolatedDoc)
  const messagesSoFar: ChatCompletionRequestMessage[] = []

  let i = 0
  const responses: string[] = []
  for (; i < messageBlocks.length; i++) {
    const messages = messageBlocks[i]
    console.log('runGlass: chat-gpt', messages)

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        Authorization: `Bearer ${options?.openaiKey || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messagesSoFar.concat(messages),
        model: model,
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
        return options.progress(
          handleRequestNode(docs.originalDoc, docs.interpolatedDoc, {
            messages: responses.concat(next.trim()),
            model,
            streaming: true,
            index: i,
          })
        )
      }
    })

    responses.push(response)
    messagesSoFar.push(...messages)
    messagesSoFar.push({ role: 'assistant', content: response })
  }

  return handleRequestNode(docs.originalDoc, docs.interpolatedDoc, {
    messages: responses,
    model,
    streaming: false,
    index: i - 1,
  })
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChatAnthropic(
  fileName: string,
  model: string,
  interpolationArgs: any,
  docs: { interpolatedDoc: string; originalDoc: string },
  options?: {
    args?: any
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
  }
): Promise<{
  finalDoc: string
  finalInterpolatedDoc: string
  rawResponse: string
}> {
  const messageBlocks = parseChatCompletionBlocks2(docs.interpolatedDoc)
  const messagesSoFar: ChatCompletionRequestMessage[] = []

  let i = 0
  const responses: string[] = []
  for (; i < messageBlocks.length; i++) {
    const messages = messageBlocks[i]

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

    const r = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        'X-API-Key': (options?.anthropicKey || process.env.ANTHROPIC_API_KEY)!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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
        return options.progress(
          handleRequestNode(docs.originalDoc, docs.interpolatedDoc, {
            messages: responses.concat(next.trim()),
            model,
            streaming: true,
            index: i,
          })
        )
      }
    })

    responses.push(response.trim())
    messagesSoFar.push(...messages)
    messagesSoFar.push({ role: 'assistant', content: response.trim() })
  }

  return handleRequestNode(docs.originalDoc, docs.interpolatedDoc, {
    messages: responses,
    model,
    streaming: false,
    index: i - 1,
  })
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassCompletion(
  fileName: string,
  model: 'gpt-3.5-turbo',
  interpolationArgs: any,
  docs: { interpolatedDoc: string; originalDoc: string },
  options?: {
    args?: any
    openaiKey?: string
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
  }
): Promise<{
  finalDoc: string
  finalInterpolatedDoc: string
  rawResponse: string
}> {
  const messageBlocks = parseChatCompletionBlocks2(docs.interpolatedDoc)
  const messagesSoFar: ChatCompletionRequestMessage[] = []

  let i = 0
  const responses: string[] = []

  for (; i < messageBlocks.length; i++) {
    const messages = parseChatCompletionBlocks(docs.interpolatedDoc)
    const useChat = messages.length > 1

    const messagesToUse = messagesSoFar.concat(messages)

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

    const r = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        Authorization: `Bearer ${options?.openaiKey || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: model,
        stream: true,
        stop: stopSequence,
      }),
    })

    const response = await handleStream(r, handleCompletionChunk, next => {
      if (!r.ok) {
        throw new Error(`HTTP error: ${r.status}`)
      }
      if (options?.progress) {
        return options.progress(
          handleRequestNode(docs.originalDoc, docs.interpolatedDoc, {
            messages: responses.concat(next.trim()),
            model,
            streaming: true,
            index: i,
          })
        )
      }
    })

    responses.push(response.trim())
    messagesSoFar.push(...messages)
    messagesSoFar.push({ role: 'assistant', content: response.trim() })
  }

  return handleRequestNode(docs.originalDoc, docs.interpolatedDoc, {
    messages: responses,
    model,
    streaming: false,
    index: i - 1,
  })
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
          try {
            const eventData = JSON.parse(content)
            fullResult = processChunk(fullResult, eventData)
            progress(fullResult)
          } catch (e) {
            console.error('runGlass: error parsing event data', e)
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
