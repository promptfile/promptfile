import { parseGlassBlocks } from './parseGlassBlocks'
import { removeGlassComments } from './removeGlassComments'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export function parseChatCompletionBlocks(
  content: string,
  interpolationArgs: any = {},
  isChatUserFirst = true
): ChatCompletionRequestMessage[] {
  const doc = removeGlassComments(content)

  // first interpolate the jsx interpolations
  const nodes = parseGlassBlocks(doc)

  const res: ChatCompletionRequestMessage[] = []

  for (const node of nodes) {
    let role = node.tag?.toLowerCase()
    let blockContent = node.child.content
    if (role == 'chat' && isChatUserFirst) {
      res.push({ role: 'user', content: interpolationArgs.input })
      continue
    }
    if (role !== 'system' && role !== 'user' && role !== 'assistant' && role !== 'block') {
      continue // ignore
    }
    if (role === 'block') {
      const roleAttr = node.attrs.find(attr => attr.name === 'role')
      const contentAttr = node.attrs.find(attr => attr.name === 'content')
      if (roleAttr == null) {
        throw new Error('<Block> tag must have role attribute')
      }
      role = parseAttr(roleAttr).toLowerCase()
      if (contentAttr != null) {
        blockContent = parseAttr(contentAttr) // TODO: don't modify existing value. don't interpolate content if string literal?
      }
    }
    // return { role: role as any, content: doc }
    res.push({ role: role as any, content: blockContent })
  }

  return res
}

function parseAttr(attr: { name: string; stringValue?: string; expressionValue?: string }): string {
  if (attr.stringValue) {
    return attr.stringValue
  }
  if (attr.expressionValue) {
    if (attr.expressionValue.startsWith("'") && attr.expressionValue.endsWith("'")) {
      return attr.expressionValue.slice(1, -1)
    }
    if (attr.expressionValue.startsWith('"') && attr.expressionValue.endsWith('"')) {
      return attr.expressionValue.slice(1, -1)
    }
    return attr.expressionValue
  }
  return ''
}
