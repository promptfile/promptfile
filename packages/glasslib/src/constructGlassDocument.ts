import { ChatBlock } from './parseChatBlocks'

export function constructGlassDocument(blocks: ChatBlock[], model: string) {
  const blocksAsTags = blocks.map(b => {
    const capitalizedRole = b.role[0].toUpperCase() + b.role.slice(1)
    return `<${capitalizedRole}>\n${b.content}\n</${capitalizedRole}>`
  })
  const tagsAsString = blocksAsTags.join('\n\n\n')
  return `---
model: ${model}
---


${tagsAsString}`
}
