export interface GlassAttribute {
  name: string
  stringValue: string
}

export function parseAttributes(element: string): GlassAttribute[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(element, 'application/xml')

  const node = doc.children[0]
  const attrs: GlassAttribute[] = []

  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i]
    attrs.push({
      name: attr.name,
      stringValue: attr.value,
    })
  }

  return attrs
}
