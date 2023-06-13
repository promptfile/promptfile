import { GlassContent } from './parseGlassBlocks'

export function updateGlassBlockAttributes(
  block: GlassContent,
  attr: { name: string; expressionValue: string }
): string {
  if (block.attrs?.some(a => a.name === attr.name)) {
    return block.content
  }
  const attrs = (block.attrs || [])
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

  return `<${block.tag} ${attrs} ${attr.name}={${attr.expressionValue}}>\n${block.child?.content || ''}\n</${
    block.tag
  }>`
}
