import { interpolateBlock, interpolateJSXExpressions } from './interpolate'
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
  doc = interpolateJSXExpressions(doc, variables)

  const blocks = parseGlassBlocks(doc)

  const res: ChatCompletionRequestMessage[] = []

  for (const block of blocks) {
    let role = block.tag.toLowerCase()
    if (role !== 'system' && role !== 'user' && role !== 'assistant' && role !== 'block') {
      continue // ignore
    }
    if (role === 'block') {
      const attrs = block.attrs || {}
      if (attrs.role == null) {
        throw new Error('<Block> tag must have role attribute')
      }
      role = attrs.role.toLowerCase() // handle "System" or "system"
      if (attrs.content != null) {
        block.content = attrs.content // TODO: don't modify existing value. don't interpolate content if string literal?
      }
    }
    // return { role: role as any, content: doc }
    const interpolatedBlock = interpolateBlock(fileName, block.content, variables)
    res.push({ role: role as any, content: interpolatedBlock })
  }

  return res
}
