import { runGlass } from '@glass-lang/glasslib'
import { UnwrapPromise } from '@glass-lang/util'
import * as vscode from 'vscode'
import { executeGlassPython } from './executeGlassPython'
import { executeGlassTypescript } from './executeGlassTypescript'
import { getDocumentFilename } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'

export async function executeTestSuite(
  outputChannel: vscode.OutputChannel,
  document: vscode.TextDocument,
  interpolationArgs: any,
  usePython: boolean
) {
  const fileName = getDocumentFilename(document)

  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()

  if (usePython) {
    const c = await executeGlassPython(document, document.getText(), interpolationArgs)

    const results: UnwrapPromise<ReturnType<typeof runGlass>>[] = []
    for (const output of c) {
      console.log('running glass', output)
      results.push(await runGlass(output, { openaiKey: openaiKey || '', anthropicKey: anthropicKey || '' }))
    }
    return results
  }

  return await executeGlassTypescript(
    document.uri.fsPath,
    outputChannel,
    document,
    document.getText(),
    fileName,
    interpolationArgs
  )
}
