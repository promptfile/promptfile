import fetch from 'node-fetch'
import { Readable } from 'stream'
import { interpolateGlass } from './interpolateGlass'
import { interpolateGlassChat } from './interpolateGlassChat'
import { getJSXNodeShellString } from './jsxElementNode'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export type ModelName =
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'claude-v1'
  | 'claude-v1-100k'
  | 'claude-instant-v1'
  | 'claude-instant-v1-100k'
  | 'claude-v1.3'
  | 'claude-v1.3-100k'
  | 'claude-v1.2'
  | 'claude-v1.0'
  | 'claude-instant-v1.1'
  | 'claude-instant-v1.1-100k'
  | 'claude-instant-v1.0'
  | 'text-davinci-003'
  | 'curie'
  | 'babbage'
  | 'ada'

export interface TranspilerOutput {
  fileName: string
  model: ModelName
  interpolatedDoc: string
  originalDoc: string
  state: any
  onResponse?: (data: { message: string }) => Promise<any>
}

export async function runGlass(
  { fileName, model, originalDoc, interpolatedDoc, state, onResponse }: TranspilerOutput,
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

  const parsedOrig = parseGlassTopLevelJsxElements(originalDoc)

  const requestNode = parsedOrig.find(node => node.tagName === 'Request')

  let newRequestNode = `<Request model="${model}" />`
  if (requestNode) {
    newRequestNode = getJSXNodeShellString(requestNode, originalDoc)
  }

  const existingFrontmatter = /---\n?([\s\S]*?)\n?---/.exec(originalDoc)?.[1] ?? ''
  const newFrontmatter = existingFrontmatter.length > 0 ? `---\n${existingFrontmatter}\n---` : ''
  originalDoc = originalDoc.replace(newRequestNode, '').replace(newFrontmatter, '').trim()
  const stateBlock = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`
  const stateBlockRegex = /<State>.+<\/State>/gs
  originalDoc
  if (Object.keys(state).length > 0) {
    if (stateBlockRegex.test(originalDoc)) {
      originalDoc = originalDoc.replace(stateBlockRegex, stateBlock)
    } else {
      originalDoc = `${newFrontmatter}\n\n${stateBlock}\n\n${originalDoc}`.trim()
    }
    if (stateBlockRegex.test(interpolatedDoc)) {
      interpolatedDoc = interpolatedDoc.replace(stateBlockRegex, stateBlock)
    } else {
      interpolatedDoc = `${newFrontmatter}\n\n${stateBlock}\n\n${interpolatedDoc}`.trim()
    }
  }

  if (options?.progress) {
    const completionFragment = generateCompletionFragment('', true, model, newRequestNode)
    options.progress({
      nextDoc: `${originalDoc.trim()}\n\n${completionFragment}`,
      nextInterpolatedDoc: `${interpolatedDoc.trim()}\n\n${completionFragment}`,
      rawResponse: '█',
    })
  }
  const res =
    model === 'gpt-3.5-turbo' || model === 'gpt-4'
      ? await runGlassChat(fileName, model, { originalDoc, interpolatedDoc }, newRequestNode, options)
      : model.startsWith('claude')
      ? await runGlassChatAnthropic(fileName, model, { originalDoc, interpolatedDoc }, newRequestNode, options)
      : await runGlassCompletion(fileName, model as any, { originalDoc, interpolatedDoc }, options)

  let codeResponse: any = undefined
  if (onResponse) {
    codeResponse = await onResponse({ message: res.rawResponse })
    if (stateBlockRegex.test(res.finalDoc)) {
      const finalStateBlock = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`
      res.finalDoc = res.finalDoc.replace(stateBlockRegex, finalStateBlock)
    }
  }

  return { ...res, initDoc: originalDoc, initInterpolatedDoc: interpolatedDoc, codeResponse }
}

const generateCompletionFragment = (message: string, streaming: boolean, model: string, newRequestNode: string) => {
  return `<Assistant>
${message}${streaming ? '█' : ''}
</Assistant>

${newRequestNode}`
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChat(
  fileName: string,
  model: ModelName,
  docs: { interpolatedDoc: string; originalDoc: string },
  newRequestNode: string,
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
  const messages = interpolateGlassChat(fileName, docs.interpolatedDoc)

  console.log('RUNNINGGGG')
  console.log(messages)

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      Authorization: `Bearer ${options?.openaiKey || process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: model,
      stream: true,
    }),
  })

  const response = await handleStream(r, handleChatChunk, next => {
    // right now claude has a leading whitespace character
    // we need to remove that!
    const fragment = generateCompletionFragment(next.trim(), options?.progress != null, model, newRequestNode)
    const nextDoc = `${docs.originalDoc.trim()}\n\n${fragment}`
    const nextInterpolatedDoc = `${docs.interpolatedDoc.trim()}\n\n${fragment}`
    if (options?.progress) {
      return options.progress({
        nextDoc: nextDoc,
        nextInterpolatedDoc,
        rawResponse: next,
      })
    }
  })

  const fragment = generateCompletionFragment(response, false, model, newRequestNode)
  return {
    finalDoc: `${docs.originalDoc.trim()}\n\n${fragment}`,
    finalInterpolatedDoc: `${docs.interpolatedDoc.trim()}\n\n${fragment}`,
    rawResponse: response,
  }
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassChatAnthropic(
  fileName: string,
  model: ModelName,
  docs: { interpolatedDoc: string; originalDoc: string },
  newRequestNode: string,
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
  const messages = interpolateGlassChat(fileName, docs.interpolatedDoc)

  let anthropicQuery = ''
  for (const msg of messages) {
    if (msg.role === 'assistant') {
      anthropicQuery += `\n\nAssistant: ${msg.content}`
    } else if (msg.role === 'user') {
      anthropicQuery += `\n\nHuman: ${msg.content}`
    } else {
      throw new Error(`Unknown role for anthropic  query: ${msg.role}`)
    }
  }
  anthropicQuery += '\n\nAssistant: '
  console.log('anthropic query', anthropicQuery)

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
    const fragment = generateCompletionFragment(next, options?.progress != null, model, newRequestNode)
    const nextDoc = `${docs.originalDoc.trim()}\n\n${fragment}`
    const nextInterpolatedDoc = `${docs.interpolatedDoc.trim()}\n\n${fragment}`
    if (options?.progress) {
      return options.progress({
        nextDoc: nextDoc,
        nextInterpolatedDoc,
        rawResponse: next.trim(), // right now claude always returns a leading empty space
      })
    }
  })

  const fragment = generateCompletionFragment(response.trim(), false, model, newRequestNode)
  return {
    finalDoc: `${docs.originalDoc.trim()}\n\n${fragment}`,
    finalInterpolatedDoc: `${docs.interpolatedDoc.trim()}\n\n${fragment}`,
    rawResponse: response.trim(),
  }
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
async function runGlassCompletion(
  fileName: string,
  model: 'text-davinci-003',
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
  const prompt = interpolateGlass(fileName, docs.interpolatedDoc)

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
    }),
  })

  const response = await handleStream(r, handleCompletionChunk, next => {
    if (options?.progress) {
      options.progress({
        nextDoc: `${docs.originalDoc}${next}<Completion model="${model}" />`,
        nextInterpolatedDoc: `${docs.interpolatedDoc}${next}<Completion model="${model}" />`,
        rawResponse: next,
      })
    }
  })

  return {
    finalDoc: `${docs.originalDoc}${response}<Completion model="${model}" />`,
    finalInterpolatedDoc: `${docs.interpolatedDoc}${response}<Completion model="${model}" />`,
    rawResponse: response,
  }
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
          const eventData = JSON.parse(content)
          fullResult = processChunk(fullResult, eventData)
          progress(fullResult)
        }
      }
    })

    readStream.on('end', () => {
      console.log('Stream has been closed by the server.')
      resolve(fullResult)
    })

    readStream.on('error', error => {
      console.log('error on stream', error)
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
