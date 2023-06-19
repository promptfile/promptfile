import { addChatBlocks } from './addChatBlocks'
import { ModelName } from './languageModels'
import { ChatBlock } from './parseChatBlocks'

/**
 * Initialize a Glass file with the specified model and chat blocks (if any).
 */
export function initGlass(model: ModelName, ...blocks: ChatBlock[]) {
  const init = `---
model: ${model}
---`

  return addChatBlocks(init, blocks)
}
