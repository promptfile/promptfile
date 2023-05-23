import fetch from 'node-fetch'
import { Readable } from 'stream'
import { interpolateGlass } from './interpolateGlass'
import { interpolateGlassChat } from './interpolateGlassChat'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export async function runGlass(
  fileName: string,
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'text-davinci-003' | 'curie' | 'babbage' | 'ada',
  docs: { interpolatedDoc: string; originalDoc: string },
  options?: {
    args?: any
    openaiKey?: string
    onResponse?: (message: any) => void
    state?: any
    progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
  }
): Promise<{
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

  let originalDoc = docs.originalDoc.replace(/<Chat.*?>\n(.+?)\n<\/Chat>/gs, '<User generated={true}>\n$1\n</User>')
  let interpolatedDoc = docs.interpolatedDoc.replace(
    /<Chat.*?>\n(.+?)\n<\/Chat>/gs,
    '<User generated={true}>\n$1\n</User>'
  )

  const state = options?.state ?? {}
  const stateBlock = `<State>\n${JSON.stringify(state, null, 2)}\n</State>`
  const stateBlockRegex = /<State>.+<\/State>/gs
  if (Object.keys(state).length > 0) {
    if (stateBlockRegex.test(originalDoc)) {
      originalDoc = originalDoc.replace(stateBlockRegex, stateBlock)
    } else {
      originalDoc = `${stateBlock}\n\n${originalDoc}`
    }
    if (stateBlockRegex.test(interpolatedDoc)) {
      interpolatedDoc = interpolatedDoc.replace(stateBlockRegex, stateBlock)
    } else {
      interpolatedDoc = `${stateBlock}\n\n${interpolatedDoc}`
    }
  }

  if (options?.progress) {
    const completionFragment = generateCompletionFragment('', true, model)
    options.progress({
      nextDoc: `${originalDoc.trim()}\n\n${completionFragment}`,
      nextInterpolatedDoc: `${interpolatedDoc.trim()}\n\n${completionFragment}`,
      rawResponse: '█',
    })
  }
  const res =
    model === 'gpt-3.5-turbo' || model === 'gpt-4'
      ? await runGlassChat(fileName, model, { originalDoc, interpolatedDoc }, options)
      : await runGlassCompletion(fileName, model as any, { originalDoc, interpolatedDoc }, options)

  if (options?.onResponse) {
    await options.onResponse({ message: res.rawResponse })
    if (stateBlockRegex.test(res.finalDoc)) {
      res.finalDoc = res.finalDoc.replace(stateBlockRegex, stateBlock)
    }
  }

  return { ...res, initDoc: docs.originalDoc, initInterpolatedDoc: docs.interpolatedDoc }
}

const generateCompletionFragment = (message: string, streaming: boolean, model: string) => {
  return `<Assistant generated={true}>
${message}${streaming ? '█' : ''}
</Assistant>

<Chat model="${model}">

</Chat>`
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
export async function runGlassChat(
  fileName: string,
  model: 'gpt-3.5-turbo' | 'gpt-4',
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
  const messages = interpolateGlassChat(fileName, docs.interpolatedDoc)

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
    const fragment = generateCompletionFragment(next, options?.progress != null, model)
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

  const fragment = generateCompletionFragment(response, false, model)
  return {
    finalDoc: `${docs.originalDoc.trim()}\n\n${fragment}`,
    finalInterpolatedDoc: `${docs.interpolatedDoc.trim()}\n\n${fragment}`,
    rawResponse: response,
  }
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
export async function runGlassCompletion(
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

  if (r.headers.get('content-type') !== 'text/event-stream') {
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

function handleCompletionChunk(currResult: string, eventData: { choices: { text: string }[] }) {
  if (eventData.choices[0].text) {
    const newResult = currResult + eventData.choices[0].text
    return newResult
  }
  return currResult
}
