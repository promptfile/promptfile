import { runGlass } from '@glass-lang/glasslib'
import { UnwrapPromise } from '@glass-lang/util'
import * as vscode from 'vscode'
import { executeGlassPython } from './executeGlassPython'
import { executeGlassTypescript } from './executeGlassTypescript'
import { getDocumentFilename } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'

export async function executeTestSuite(document: vscode.TextDocument, interpolationArgs: any, usePython: boolean) {
  const fileName = getDocumentFilename(document)

  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()

  const c = usePython
    ? await executeGlassPython(document, interpolationArgs)
    : await executeGlassTypescript(document, fileName, interpolationArgs)

  const results: UnwrapPromise<ReturnType<typeof runGlass>>[] = []
  for (const output of c) {
    console.log('running glass', output)
    results.push(await runGlass(output, { openaiKey: openaiKey || '', anthropicKey: anthropicKey || '' }))
  }
  return results
}
