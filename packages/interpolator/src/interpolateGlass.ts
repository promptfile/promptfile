import { interpolate } from './interpolate'
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

function interpolateBlock(fnName: string, template: string, variables: Record<string, string>) {
  const interpolateBlock = interpolate(template, variables)

  // check that there are no uninterpolated variables
  const uninterpolatedVariables = interpolateBlock.match(/\${([A-Za-z0-9]*)}/g)
  if (uninterpolatedVariables) {
    // TODO: these will show names like "1", "2", etc instead of the actual variable names, since the transpiler rewrites them
    throw new Error(`un-interpolated variables in ${fnName}.glass: ${uninterpolatedVariables.join(', ')}`)
  }

  return interpolateBlock
}
