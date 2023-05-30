import { removeEscapedHtml, restoreEscapedHtml } from './escapeHtml'
import { getJSXNodeInsidesString } from './jsxElementNode'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'
import { removeGlassComments } from './removeGlassComments'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant' | 'prompt'
  content: string
  name?: string
}

export function parseChatCompletionBlocks(
  content: string,
  interpolationArgs: any = {},
  isChatUserFirst = true
): ChatCompletionRequestMessage[] {
  const removedLiterals = removeEscapedHtml(content)

  const doc = removeGlassComments(removedLiterals.output)

  // first interpolate the jsx interpolations
  const nodes = parseGlassTopLevelJsxElements(doc)

  const res: ChatCompletionRequestMessage[] = []

  for (const node of nodes) {
    let role = node.tagName?.toLowerCase()
    let blockContent = restoreEscapedHtml(getJSXNodeInsidesString(node, doc), removedLiterals.replacements)
    if (role == 'chat' && isChatUserFirst) {
      res.push({ role: 'user', content: interpolationArgs.input })
      continue
    }
    if (role !== 'system' && role !== 'user' && role !== 'assistant' && role !== 'block' && role !== 'prompt') {
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
