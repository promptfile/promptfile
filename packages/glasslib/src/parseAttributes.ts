export interface GlassAttribute {
  name: string
  stringValue: string
}

export function parseAttributes(element: string): GlassAttribute[] {
  const attributePattern = /(\w+)="([^"]*)"/g
  const attrs: GlassAttribute[] = []
  let match

  while ((match = attributePattern.exec(element)) !== null) {
    attrs.push({
      name: match[1],
      stringValue: match[2],
    })
  }

  return attrs
}
