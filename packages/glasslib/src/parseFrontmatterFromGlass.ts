import { parse } from 'yaml'

interface ParsedResult {
  model?: string
  description?: string
  temperature?: number
}

export function parseFrontmatterFromGlass(glass: string): ParsedResult | null {
  const frontmatterRegex = /^---\n?([\s\S]*?)\n?---/
  const match = glass.match(frontmatterRegex)

  if (!match) {
    return null
  }

  const frontmatter = match[1].trim()
  if (frontmatter === '') {
    return null
  }

  const yamlContent = frontmatter.replace(/---/g, '').trim()

  const result = parse(yamlContent)

  if (typeof result === 'object' && result !== null) {
    const res: any = {}
    if (result.model) {
      res['model'] = result.model
    }
    if (result.description) {
      res['description'] = result.description
    }
    if (result.temperature) {
      res['temperature'] = result.temperature
    }
    return res as ParsedResult
  }

  return null
}
