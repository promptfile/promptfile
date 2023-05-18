import { Response } from 'node-fetch'
import { TextDecoder } from 'util'

export function processChatStream(currResult: string, eventData: { choices: { delta: { content: string } }[] }) {
  if (eventData.choices[0].delta.content) {
    const newResult = currResult + eventData.choices[0].delta.content
    return newResult
  }
  return currResult
}
export async function handleStreamResponse(
  r: Response,
  processCb: (currResult: string, eventData: any) => string
): Promise<string> {
  if (!r.ok) {
    throw new Error(`HTTP error: ${r.status}`)
  }

  if (r.headers.get('content-type') !== 'text/event-stream') {
    throw new Error(`Expected "text/event-stream" content type, but received "${r.headers.get('content-type')}"`)
  }

  let fullResult = ''

  return new Promise((resolve, reject) => {
    const decoder = new TextDecoder()
    let data = ''

    if (r.body) {
      r.body.on('data', (chunk: Buffer) => {
        data += decoder.decode(chunk)
        const lines = data.split('\n')
        data = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const content = line.slice('data:'.length).trim()
            if (content === '[DONE]') {
              return resolve(fullResult)
            }
            const eventData = JSON.parse(content)
            fullResult = processCb(fullResult, eventData)
          }
        }
      })

      r.body.on('end', () => {
        // If stream ends without [DONE], treat as error
        reject(new Error('Stream ended without [DONE]'))
      })

      r.body.on('error', err => {
        reject(err)
      })
    }
  })
}
