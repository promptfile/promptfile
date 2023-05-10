import { parseGlassBlocks } from './parseGlassBlocks.js'
import { removeGlassComments } from './removeGlassComments.js'
import { checkOk } from './util/checkOk.js'
import { interpolate } from './util/interpolate.js'

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

/**
 * Takes a glass template string and interpolation variables and outputs an array of chat messages you can use to prompt ChatGPT API (e.g. gpt-3.5-turbo or gpt-4).
 */
export function interpolateGlassChat(
  fileName: string,
  content: string,
  variables: Record<string, string> = {}
): ChatCompletionRequestMessage[] {
  const doc = removeGlassComments(content)

  const blocks = parseGlassBlocks(doc)
  const kshotBlocks: Record<string, ChatCompletionRequestMessage[]> = {}

  const res: ChatCompletionRequestMessage[] = []

  let lastKshotSequence = ''

  function drainKshotSequence(blocks: ChatCompletionRequestMessage[], kshotVarName: string, kshots: any) {
    checkOk(kshots, `missing kshot variables in ${fileName}.glass: {${kshotVarName}}`)
    checkOk(
      kshots instanceof Array,
      `kshot variables for glass template ${fileName}.glass @ ${kshotVarName} is not an array`
    )

    const kshotsToAdd = kshots.flatMap((kshotVars: any) => {
      return blocks.map(b => {
        // use the union of the outer args and the kshot args
        const kshotInterpolation = interpolateBlock(fileName, b.content, kshotVars, kshotVarName)
        const finalInterpolation = interpolateBlock(fileName, kshotInterpolation, variables)
        return {
          role: b.role,
          content: finalInterpolation,
        }
      })
    })

    res.push(...kshotsToAdd)
  }

  for (const block of blocks) {
    // return { role: role as any, content: doc }
    if (block.role === 'system' || block.role === 'user' || block.role === 'assistant') {
      if (lastKshotSequence) {
        drainKshotSequence(kshotBlocks[lastKshotSequence], lastKshotSequence, variables[lastKshotSequence])
      }
      const interpolatedBlock = interpolateBlock(fileName, block.content, variables)
      res.push({ role: block.role as any, content: interpolatedBlock })
      lastKshotSequence = ''
    } else {
      const [kshotName, kshotRole] = block.role.split('.')
      checkOk(kshotName.startsWith('[') && kshotName.endsWith(']'), `invalid kshot name ${kshotName}`)
      const kshotVarName = kshotName.slice(1, -1)

      if (kshotBlocks[kshotVarName] == null) {
        // starting a new kshot sequence, possibly drain the last one
        if (lastKshotSequence) {
          drainKshotSequence(kshotBlocks[lastKshotSequence], lastKshotSequence, variables[lastKshotSequence])
        }
        kshotBlocks[kshotVarName] = [{ role: kshotRole as any, content: block.content }]
        lastKshotSequence = kshotVarName
      } else {
        kshotBlocks[kshotVarName].push({ role: kshotRole as any, content: block.content })
      }
    }
  }

  return res
}

export function interpolateBlock(fnName: string, template: string, variables: any, prefix?: any) {
  const interpolateBlock = interpolate(template, variables, prefix)

  // check that there are no uninterpolated variables
  const uninterpolatedVariables = interpolateBlock.match(/{([A-Za-z]*)}/g)
  if (uninterpolatedVariables && !prefix) {
    throw new Error(`un-interpolated variables in ${fnName}.glass: ${uninterpolatedVariables.join(', ')}`)
  }

  return interpolateBlock
}

/**
 * Takes a Glass template like the following:
 *
 * ```
 * -- system
 * {{systemPrompt}}
 * --
 *
 * -- user
 * {{userPrompt}}
 * --
 * ```
 *
 * And returns an array of ChatCompletionRequestMessage objects like the following:
 *
 * { role: 'system', content: '{{systemPrompt}}' }
 */
