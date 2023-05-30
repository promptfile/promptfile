import { runGlass } from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import * as vscode from 'vscode'
import { executeGlassPython } from './executeGlassPython'
import { executeGlassTypescriptNew } from './executeGlassTypescript'
import { getDocumentFilename } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'

export async function executeGlassFile(
  document: vscode.TextDocument,
  interpolationArgs: any,
  usePython: boolean,
  progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
) {
  const fileName = getDocumentFilename(document)

  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()

  if (usePython) {
    const c = await executeGlassPython(document, interpolationArgs)
    checkOk(c.length >= 0, 'No transpiler output generated')
    return await runGlass(c[0], { openaiKey: openaiKey || '', anthropicKey: anthropicKey || '', progress })
  }

  return await executeGlassTypescriptNew(document, fileName, interpolationArgs, progress)
}
