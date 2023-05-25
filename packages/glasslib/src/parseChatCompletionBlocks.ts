import { interpolateBlock, interpolateJSXExpressions } from './interpolate'
import { ChatCompletionRequestMessage } from './interpolateGlassChat'
import { getJSXNodeInsidesString } from './jsxElementNode'
import { parseGlassBlocks } from './parseGlassBlocks'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'
import { removeGlassComments } from './removeGlassComments'
import { replaceLiterals, restoreLiterals } from './replaceLiterals'

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

export function parseChatCompletionBlocks(content: string): ChatCompletionRequestMessage[] {
  const removedLiterals = replaceLiterals(content)

  const doc = removeGlassComments(removedLiterals.output)

  // first interpolate the jsx interpolations
  const nodes = parseGlassTopLevelJsxElements(doc)

  const res: ChatCompletionRequestMessage[] = []

  for (const node of nodes) {
    let role = node.tagName?.toLowerCase()
    let blockContent = restoreLiterals(getJSXNodeInsidesString(node, doc), removedLiterals.replacements)
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
