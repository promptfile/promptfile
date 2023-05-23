export function parseGlassFrontmatter(document: string): any {
  const frontmatterRegex = /^---\n?([\s\S]*?)\n?---/
  const match = document.match(frontmatterRegex)

  if (!match) {
    return undefined
  }

  const frontmatter = match[1].trim()
  if (frontmatter === '') {
    return {}
  }

  const frontmatterArgs: any[] = []
  const lines = frontmatter.split('\n')
  for (const line of lines) {
    if (line.trim() === '') {
      continue
    }
    const [name, rest] = line.split(/:\s+/)
    const [type, description] = rest.split(/\s+/)
    const optional = type.endsWith('?')
    const normType = optional ? type.slice(0, -1) : type
    frontmatterArgs.push({ name, type: normType, description, optional })
  }
  return frontmatterArgs
}
