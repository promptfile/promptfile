import { ChatBlock } from './parseChatBlocks'
import { LLMRequest } from './request'

export function constructGlassDocument(blocks: ChatBlock[], request: LLMRequest) {
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
    return `<${capitalizedRole} ${attributeString}>\n${b.content}\n</${capitalizedRole}>`
  })
  const tagsAsString = blocksAsTags.join('\n\n\n')
  const frontmatter = Object.entries(request)
    .filter(([k, v]) => v != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return `---
${frontmatter}
---


${tagsAsString}`
}
