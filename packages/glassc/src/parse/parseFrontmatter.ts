import { parse } from 'yaml'

interface ParsedResult {
  language: string
  args: Record<string, string>
}

export function parseFrontmatter(yamlString: string): ParsedResult | null {
  const yamlContent = yamlString.replace(/---/g, '').trim()

  const result = parse(yamlContent)

  if (typeof result === 'object' && result !== null) {
    const res: any = {}
    if (result.language) {
      res['language'] = result.language
    }
    if (result.args) {
      res['args'] = result.args
    }
    return res as ParsedResult
  }

  return null
}
