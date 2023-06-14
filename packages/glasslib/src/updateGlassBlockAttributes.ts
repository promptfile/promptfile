import { GlassContent } from './parseGlassBlocks'

export function updateGlassBlockAttributes(block: GlassContent, attr: { name: string; stringValue: string }): string {
  if (block.attrs?.some(a => a.name === attr.name)) {
    return block.content
  }
  const attrs = (block.attrs || [])
    .concat(attr)
    .map(attr => {
      if (attr.expressionValue != null) {
        return `${attr.name}={${attr.expressionValue}}`
      }
      if (attr.stringValue != null) {
        return `${attr.name}="${attr.stringValue}"`
      }
      return attr.name
    })
    .join(' ')

  return `<${block.tag} ${attrs}>\n${block.child?.content || ''}\n</${block.tag}>`
}
