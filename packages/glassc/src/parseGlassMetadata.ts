import { parseGlassBlocks } from './parseGlassBlocks'

const contentBlocks = new Set(['System', 'User', 'Assistant', 'Prompt'])

export function parseGlassMetadata(document: string) {
  const blocks = parseGlassBlocks(document)

  const relevantBlocks = blocks.filter(block => contentBlocks.has(block.tag))

  const vars = relevantBlocks.flatMap(block => {
    let match: RegExpMatchArray | null = null
    const interpolationVariables = []
    const regex = /\${([A-Za-z0-9]+)}/g
    while ((match = regex.exec(block.content))) {
      interpolationVariables.push(match[1])
    }
    return interpolationVariables
  })

  return {
    interpolationVariables: Array.from(new Set(vars)),
    isChat: relevantBlocks.some(block => block.tag === 'System' || block.tag === 'User' || block.tag === 'Assistant'),
  }
}
