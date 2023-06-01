import glasslib from '@glass-lang/glasslib'
import { TYPESCRIPT_GLOBALS } from '../transpile/typescriptGlobals'
import { parseCodeBlock } from './parseTypescript'

const contentBlocks = new Set(['System', 'User', 'Assistant', 'Block'])

export function parseGlassMetadata(document: string) {
  const toplevelCode = glasslib
    .parseGlassDocument(document)
    .filter(t => t.type === 'code')
    .map(t => t.content)
    .join('\n')

  const blocks = glasslib.parseGlassBlocksRecursive(document)
  const relevantBlocks = blocks.filter(block => contentBlocks.has(block.tag || ''))

  const vars = relevantBlocks.flatMap(block => {
    let match: RegExpMatchArray | null = null
    const interpolationVariables: string[] = []
    const regex = /\${([A-Za-z0-9]+)}/g
    while ((match = regex.exec(block.content))) {
      interpolationVariables.push(match[1])
    }
    return interpolationVariables
  })

  const parsedCodeBlock = parseCodeBlock(toplevelCode)

  const finalVars = new Set(vars)

  for (const symbol of parsedCodeBlock.symbolsAddedToScope) {
    finalVars.delete(symbol)
  }
  for (const symbol of parsedCodeBlock.importedSymbols) {
    finalVars.delete(symbol)
  }
  for (const symbol of parsedCodeBlock.undeclaredValuesNeededInScope) {
    finalVars.add(symbol)
  }

  TYPESCRIPT_GLOBALS.forEach(globalValue =>
    // remove all the globally defined values
    finalVars.delete(globalValue)
  )

  return {
    interpolationVariables: Array.from(finalVars),
  }
}
