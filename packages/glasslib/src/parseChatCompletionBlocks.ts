import { RequestData, parseGlassBlocks } from './parseGlassBlocks'
import { removeGlassComments } from './removeGlassComments'
import { DEFAULT_TOKEN_COUNTER } from './tokenCounter'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  type?: 'function_call'
}

export function parseChatCompletionBlocks(content: string): ChatCompletionRequestMessage[] {
  const doc = removeGlassComments(content)

  // first interpolate the jsx interpolations
  const nodes = parseGlassBlocks(doc)

  const res: ChatCompletionRequestMessage[] = []

  for (const node of nodes.filter(n => n.type === 'block')) {
    let role = node.tag?.toLowerCase()
    let blockContent = node.child!.content
    if (role !== 'system' && role !== 'user' && role !== 'assistant' && role !== 'block' && role !== 'function') {
      continue // ignore
    }
    if (role === 'block') {
      const roleAttr = node.attrs!.find(attr => attr.name === 'role')
      const contentAttr = node.attrs!.find(attr => attr.name === 'content')
      if (roleAttr == null) {
        throw new Error('<Block> tag must have role attribute')
      }
      role = parseAttr(roleAttr).toLowerCase()
      if (contentAttr != null) {
        blockContent = parseAttr(contentAttr) // TODO: don't modify existing value. don't interpolate content if string literal?
      }
    }
    const nameAttr = node.attrs!.find(attr => attr.name === 'name')
    // return { role: role as any, content: doc }
    res.push({ role: role as any, content: blockContent, name: nameAttr?.stringValue })
  }

  return res
}

export function parseChatCompletionBlocks2(
  content: string,
  requestBlocks: RequestData[],
  tokenCounter = DEFAULT_TOKEN_COUNTER
): ChatCompletionRequestMessage[][] {
  const doc = removeGlassComments(content)

  // first interpolate the jsx interpolations
  const nodes = parseGlassBlocks(doc)

  const res: ChatCompletionRequestMessage[][] = []

  let currBlock: ChatCompletionRequestMessage[] = []

  let totalNumTokensUsed = 0

  const requestIndices: number[] = nodes.map((n, i) => (n.tag === 'Request' ? i : null)).filter(i => i != null) as any

  for (let i = 0; i < requestIndices.length; i++) {
    // for each Request, scan backwards to construct the block
    let minIndex = 0
    if (i > 0) {
      // scan back to the previous request
      minIndex = requestIndices[i - 1] + 1
    }
    const currRequestBlock = requestBlocks[i]
    for (let j = requestIndices[i] - 1; j >= minIndex; j--) {
      const node = nodes[j]
      let role = node.tag?.toLowerCase()

      let blockContent = node.child!.content

      if (role !== 'system' && role !== 'user' && role !== 'assistant' && role !== 'block' && role !== 'function') {
        continue // ignore
      }
      if (role === 'block') {
        const roleAttr = node.attrs!.find(attr => attr.name === 'role')
        const contentAttr = node.attrs!.find(attr => attr.name === 'content')
        if (roleAttr == null) {
          throw new Error('<Block> tag must have role attribute')
        }
        role = parseAttr(roleAttr).toLowerCase()
        if (contentAttr != null) {
          blockContent = parseAttr(contentAttr) // TODO: don't modify existing value. don't interpolate content if string literal?
        }
      }

      const amountToReserve = tokenCounter.reserveCount || 250 // todo: pick reserve count per model
      const blockTokens = tokenCounter.countTokens(node.child!.content, currRequestBlock.model)
      const maxTokens = tokenCounter.maxTokens(currRequestBlock.model)

      if (totalNumTokensUsed + blockTokens > maxTokens - amountToReserve) {
        continue // skip this block
      }

      totalNumTokensUsed += blockTokens

      // return { role: role as any, content: doc }
      const nameAttr = node.attrs!.find(attr => attr.name === 'name')
      currBlock.push({ role: role as any, content: blockContent, name: nameAttr?.stringValue })
    }

    if (currBlock.length > 0) {
      res.push(currBlock.reverse())
    }

    currBlock = []
  }

  // for (const node of nodes.filter(n => n.type === 'block')) {
  //   if (node.tag === 'Request') {
  //     res.push(currBlock)
  //     currBlock = []
  //     continue
  //   }
  //   let role = node.tag?.toLowerCase()

  //   let blockContent = node.child!.content
  //   const currRequestBlock = requestBlocks[res.length]

  //   if (role !== 'system' && role !== 'user' && role !== 'assistant' && role !== 'block' && role !== 'function') {
  //     continue // ignore
  //   }
  //   if (role === 'block') {
  //     const roleAttr = node.attrs!.find(attr => attr.name === 'role')
  //     const contentAttr = node.attrs!.find(attr => attr.name === 'content')
  //     if (roleAttr == null) {
  //       throw new Error('<Block> tag must have role attribute')
  //     }
  //     role = parseAttr(roleAttr).toLowerCase()
  //     if (contentAttr != null) {
  //       blockContent = parseAttr(contentAttr) // TODO: don't modify existing value. don't interpolate content if string literal?
  //     }
  //   }

  //   const amountToReserve = tokenCounter.reserveCount || 300
  //   const blockTokens = tokenCounter.countTokens(node.child!.content, currRequestBlock.model)
  //   const maxTokens = tokenCounter.maxTokens(currRequestBlock.model)

  //   if (totalNumTokensUsed + blockTokens >= maxTokens - amountToReserve) {
  //     continue // skip this block
  //   }

  //   totalNumTokensUsed += blockTokens

  //   // return { role: role as any, content: doc }
  //   const nameAttr = node.attrs!.find(attr => attr.name === 'name')
  //   currBlock.push({ role: role as any, content: blockContent, name: nameAttr?.stringValue })
  // }

  // if (currBlock.length > 0) {
  //   res.push(currBlock)
  // }

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
