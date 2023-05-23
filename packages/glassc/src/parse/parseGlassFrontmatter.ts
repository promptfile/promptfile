import * as yaml from 'js-yaml'

export function parseGlassFrontmatter(document: string): any {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = document.match(frontmatterRegex)

  if (!match) {
    return undefined
  }

  const frontmatter = match[1]

  const frontmatterArgs = yaml.load(frontmatter)
  return frontmatterArgs
}
