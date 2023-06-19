import { runGlassTranspilerOutput } from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import * as vscode from 'vscode'
import { executeGlassTypescript } from './executeGlassTypescript'
import { getDocumentFilename } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'
import { countTokens, maxTokensForModel } from './util/tokenCounter'

export async function executeGlassFile(
  glassfilePath: string,
  outputChannel: vscode.OutputChannel,
  document: vscode.TextDocument,
  content: string, // use this instead of document.getText because it may be stale wtf
  inputs: any,
  progress?: (data: { nextGlassfile: string; response?: string }) => void
) {
  const fileName = getDocumentFilename(document)

  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()

  // const isDocumentPython = document.languageId === 'glass-py'

  // if (isDocumentPython) {
  //   const c = await executeGlassPython(document, content, inputs)
  //   checkOk(c.length >= 0, 'No transpiler output generated')
  //   return await runGlassTranspilerOutput(c[0], {
  //     tokenCounter: {
  //       countTokens: countTokens,
  //       maxTokens: maxTokensForModel,
  //     },
  //     openaiKey: openaiKey || '',
  //     anthropicKey: anthropicKey || '',
  //     progress,
  //     output: outputChannel.appendLine,
  //   })
  // }

  const c = await executeGlassTypescript(glassfilePath, outputChannel, document, content, fileName, inputs)
  checkOk(c.length >= 0, 'No transpiler output generated')
  const res = await runGlassTranspilerOutput(c[0], {
    tokenCounter: {
      countTokens: countTokens,
      maxTokens: maxTokensForModel,
    },
    openaiKey: openaiKey || '',
    anthropicKey: anthropicKey || '',
    progress,
    output: outputChannel.appendLine,
  })
  return res
}
