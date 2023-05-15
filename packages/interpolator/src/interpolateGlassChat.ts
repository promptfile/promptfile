import { interpolateBlock } from './interpolate'
import { parseGlassBlocks } from './parseGlassBlocks'
import { removeGlassComments } from './removeGlassComments'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
export function interpolateGlassChat(
  fileName: string,
  content: string,
  variables: any = {}
): ChatCompletionRequestMessage[] {
  let doc = removeGlassComments(content)

  // first interpolate the jsx interpolations
  doc = doc.replace(/\${jsx-([0-9]+)}/g, (match, key) => {
    const value = variables[`jsx-${key}`]
    return value
  })

  const blocks = parseGlassBlocks(doc)

  const res: ChatCompletionRequestMessage[] = []

  for (const block of blocks) {
    const role = block.tag.toLowerCase()
    if (role !== 'system' && role !== 'user' && role !== 'assistant') {
      continue // ignore
    }
    // return { role: role as any, content: doc }
    if (role === 'system' || role === 'user' || role === 'assistant') {
      const interpolatedBlock = interpolateBlock(fileName, block.content, variables)
      res.push({ role: role as any, content: interpolatedBlock })
    }
  }

  return res
}
