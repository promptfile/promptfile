import { ChatBlock, runGlassTranspilerOutput } from '@glass-lang/glasslib'
import fetch from 'node-fetch'
import * as vscode from 'vscode'
import { executeGlassTypescript } from './executeGlassTypescript'
import { getDocumentFilename } from './util/isPromptFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'
import { countTokens, maxTokensForModel } from './util/tokenCounter'

export async function executeGlassFile(
  glassfilePath: string,
  outputChannel: vscode.OutputChannel,
  document: vscode.TextDocument,
  content: string, // use this instead of document.getText because it may be stale wtf
  inputs: any,
  progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
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

  const functionEndpoint: string = vscode.workspace.getConfiguration('prompt').get('functionEndpoint') as any

  const c = await executeGlassTypescript(glassfilePath, outputChannel, document, content, fileName, inputs)
  const res = await runGlassTranspilerOutput(c, {
    tokenCounter: {
      countTokens: countTokens,
      maxTokens: maxTokensForModel,
    },
    openaiKey: openaiKey || '',
    anthropicKey: anthropicKey || '',
    progress,
    output: outputChannel.appendLine,
    getFunction: async name => {
      const res = await fetch(`${functionEndpoint}/${name}`, {
        method: 'GET',
      })
      return (await res.json()) as any
    },
    execFunction: async (name, args) => {
      const res = await fetch(`${functionEndpoint}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json ',
        },
        body: JSON.stringify(args),
      })
      return (await res.json()) as any
    },
  })
  return res
}
