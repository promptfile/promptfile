import { removeGlassComments } from './removeGlassComments.js'
import { interpolate } from './util/interpolate.js'

/**
 * Takes a glass template string and interpolation variables and outputs a string you can use to prompt GPT-3 (e.g. text-davinci-003).
 */
export function interpolateGlass(fnName: string, content: string, variables: any = {}): string {
  const doc = removeGlassComments(content)
  return interpolateBlock(fnName, doc, variables)
}

function interpolateBlock(fnName: string, template: string, variables: any) {
  const interpolateBlock = interpolate(template, variables)

  // check that there are no uninterpolated variables
  const uninterpolatedVariables = interpolateBlock.match(/{([A-Za-z0-9]*)}/g)
  if (uninterpolatedVariables) {
    throw new Error(`un-interpolated variables in ${fnName}.glass: ${uninterpolatedVariables.join(', ')}`)
  }

  return interpolateBlock
}
