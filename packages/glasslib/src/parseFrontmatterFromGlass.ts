import { parse } from 'yaml'

interface ParsedResult {
  file: string
  timestamp: string
  model: string
  session: string
  language: string
  args: Record<string, string>
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

  return parseFrontmatter(frontmatter)
}

export function parseFrontmatter(yamlString: string): ParsedResult | null {
  const yamlContent = yamlString.replace(/---/g, '').trim()

  const result = parse(yamlContent)

  if (typeof result === 'object' && result !== null) {
    const res: any = {}
    if (result.session) {
      res['session'] = result.session
    }
    if (result.timestamp) {
      res['timestamp'] = result.timestamp
    }
    if (result.file) {
      res['file'] = result.file
    }
    if (result.model) {
      res['model'] = result.model
    }
    return res as ParsedResult
  }

  return null
}