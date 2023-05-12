import { parseCodeBlock } from './parseCodeBlock'
import { parseGlassBlocks } from './parseGlassBlocks'
import { parseGlassASTImports } from './util/parseGlassAST'

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

  const imports = parseGlassASTImports(document)

  const codeBlocks = blocks.filter(block => block.tag === 'Code')
  const parsedCodeBlocks = codeBlocks.map(block => parseCodeBlock(`${imports.join('\n')}\n\n${block.content}`))

  const finalVars = new Set(vars)

  for (const block of parsedCodeBlocks) {
    for (const symbol of block.symbolsAddedToScope) {
      finalVars.delete(symbol)
    }
    for (const symbol of block.importedSymbols) {
      finalVars.delete(symbol)
    }
    for (const symbol of block.undeclaredValuesNeededInScope) {
      finalVars.add(symbol)
    }
  }

  return {
    interpolationVariables: Array.from(finalVars),
    isChat: relevantBlocks.some(block => block.tag === 'System' || block.tag === 'User' || block.tag === 'Assistant'),
  }
}
