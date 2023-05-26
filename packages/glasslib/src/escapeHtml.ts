type LiteralReplacements = Record<string, string>

export function removeEscapedHtml(input: string) {
  const replacements: LiteralReplacements = {}
  let count = 0
  const output = input.replace(/<Text([^>]*)>([\s\S]*?)<\/Text>/g, (match, attrGroup, contentGroup) => {
    count++
    const key = `GLASS_LITERAL_${count}`
    replacements[key] = contentGroup
    return `<Text${attrGroup}>${key}</Text>`
  })
  return { output, replacements }
}

export function restoreEscapedHtml(document: string, literals: LiteralReplacements): string {
  for (const key in literals) {
    // Be sure to escape the key for usage in a RegExp.
    const escapedKey = key.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedKey, 'g')

    document = document.replace(regex, `${literals[key]}`)
  }
  return document
}
