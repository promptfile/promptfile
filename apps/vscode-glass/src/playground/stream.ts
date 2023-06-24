import { LLMResponse } from '@glass-lang/glasslib'
import { Readable } from 'stream'

export async function handleStream(
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

export function handleChatChunk(
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
    newResult.content = JSON.stringify(newResult.function_call, null, 2)
    return newResult
  }
  if (eventData.choices[0].delta.content) {
    const newResult = { ...currResult }
    newResult.content += eventData.choices[0].delta.content
    return newResult
  }
  return currResult
}

export function handleCompletionChunk(currResult: LLMResponse, eventData: { choices: { text: string }[] }) {
  if (eventData.choices[0].text) {
    const newResult = { ...currResult }
    newResult.content += eventData.choices[0].text
    return newResult
  }
  return currResult
}
