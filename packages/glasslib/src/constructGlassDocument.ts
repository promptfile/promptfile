import { ChatBlock } from './parseChatBlocks'

export function constructGlassDocument(blocks: ChatBlock[], model: string) {
  const blocksAsTags = blocks.map(b => {
    const capitalizedRole = b.role[0].toUpperCase() + b.role.slice(1)
    const attributesToAdd: Record<string, string> = {}
    if (b.name != null) {
      attributesToAdd.name = b.name
    }
    if (b.type != null) {
      attributesToAdd.type = b.type
    }
    const attributeString = Object.entries(attributesToAdd)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
    return `<${capitalizedRole}${attributeString}>\n${b.content}\n</${capitalizedRole}>`
  })
  const tagsAsString = blocksAsTags.join('\n\n\n')
  return `---
model: ${model}
---


${tagsAsString}`
}
