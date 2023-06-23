import { parseGlassBlocks } from '@glass-lang/glasslib'

const contentBlocks = new Set(['System', 'User', 'Assistant', 'Block'])

export function parseGlassVariables(document: string): string[] {
  const blocks = parseGlassBlocks(document, true)
  const relevantBlocks = blocks.filter(block => contentBlocks.has(block.tag || ''))

  const vars = relevantBlocks.flatMap(block => {
    let match: RegExpMatchArray | null = null
    const interpolationVariables: string[] = []
    const regex = /@{([A-Za-z0-9]+)}/g
    while ((match = regex.exec(block.child!.content))) {
      interpolationVariables.push(match[1])
    }
    return interpolationVariables
  })

  const finalVars = new Set(vars)

  return Array.from(finalVars)
}
