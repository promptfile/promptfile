import { interpolateBlock } from './interpolate'
import { parseGlassBlocks } from './parseGlassBlocks'
import { removeGlassComments } from './removeGlassComments'

/**
 * Takes a glass template string and interpolation variables and outputs a string you can use to prompt GPT-3 (e.g. text-davinci-003).
 */
export function interpolateGlass(fnName: string, content: string, variables: any = {}): string {
  let doc = removeGlassComments(content)

  // first interpolate the jsx interpolations
  doc = doc.replace(/\${jsx-([0-9]+)}/g, (match, key) => {
    const value = variables[`jsx-${key}`]
    return value
  })

  const blocks = parseGlassBlocks(doc)
  const promptBlocks = blocks.filter(b => b.tag === 'Prompt')
  if (promptBlocks.length !== 1) {
    throw new Error(`expected exactly one <User> block in ${fnName}.glass (got ${promptBlocks.length})`)
  }
  return interpolateBlock(fnName, promptBlocks[0].content, variables)
}
