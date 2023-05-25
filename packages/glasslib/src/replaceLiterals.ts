type LiteralReplacements = Record<string, string>

export function replaceLiterals(input: string) {
  const replacements: LiteralReplacements = {}
  let count = 0
  const output = input.replace(/<Literal>([\s\S]*?)<\/Literal>/g, (match, group) => {
    count++
    const key = `GLASS_LITERAL_${count}`
    replacements[key] = group
    return key
  })
  return { output, replacements }
}

export function restoreLiterals(document: string, literals: LiteralReplacements): string {
  for (const key in literals) {
    // Be sure to escape the key for usage in a RegExp.
    const escapedKey = key.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedKey, 'g')

    document = document.replace(regex, `<Literal>${literals[key]}</Literal>`)
  }
  return document
}
