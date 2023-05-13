import { interpolateBlock } from './interpolate'
import { parseGlassBlocks } from './parseGlassBlocks'
import { removeGlassComments } from './removeGlassComments'

/**
 * Takes a glass template string and interpolation variables and outputs a string you can use to prompt GPT-3 (e.g. text-davinci-003).
 */
export function interpolateGlass(fnName: string, content: string, variables = {}): string {
  const doc = removeGlassComments(content)
  const blocks = parseGlassBlocks(doc)
  const promptBlocks = blocks.filter(b => b.tag === 'Prompt')
  if (promptBlocks.length !== 1) {
    throw new Error(`expected exactly one <Prompt> block in ${fnName}.glass (got ${promptBlocks.length})`)
  }
  return interpolateBlock(fnName, promptBlocks[0].content, variables)
}
