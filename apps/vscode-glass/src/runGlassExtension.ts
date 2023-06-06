import { removeImports } from '@glass-lang/glassc'
import { parseGlassDocument, runGlass } from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import * as vscode from 'vscode'
import { executeGlassPython } from './executeGlassPython'
import { executeGlassTypescript, executeGlassTypescriptInVm } from './executeGlassTypescript'
import { getDocumentFilename } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'
import { countTokens, maxTokensForModel } from './util/tokenCounter'

export async function executeGlassFile(
  glassfilePath: string,
  outputChannel: vscode.OutputChannel,
  document: vscode.TextDocument,
  content: string, // use this instead of document.getText because it may be stale wtf
  inputs: any,
  progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
) {
  const fileName = getDocumentFilename(document)

  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()

  const isDocumentPython = document.languageId === 'glass-py'

  if (isDocumentPython) {
    const c = await executeGlassPython(document, content, inputs)
    checkOk(c.length >= 0, 'No transpiler output generated')
    return await runGlass(c[0], {
      transcriptTokenCounter: {
        countTokens: countTokens,
        maxTokens: maxTokensForModel,
      },
      openaiKey: openaiKey || '',
      anthropicKey: anthropicKey || '',
      progress,
      output: outputChannel.appendLine,
    })
  }
  const parsedDoc = parseGlassDocument(content)
  const codeBlocks = parsedDoc
    .filter(b => b.type === 'code')
    .map(b => b.content)
    .join('\n')
  // if there's imports, we have to shell out to execute the code
  const { imports } = removeImports(codeBlocks)
  const nonGlassImports = imports
    .split('\n')
    .filter(i => !i.includes('.glass'))
    .join('\n')
  if (nonGlassImports.trim().length) {
    // have to shell out since we have imports
    // const parsedImports = parseTsImports(nonGlassImports)
    // const moduleImports = parsedImports

    //   .filter(i => !i.path.startsWith('.') && !nodeDefaultModules.has(i.path))
    //   .map(i => i.path)
    return await executeGlassTypescript(glassfilePath, outputChannel, document, content, fileName, inputs, progress)
  }

  const c = await executeGlassTypescriptInVm(
    glassfilePath,
    outputChannel,
    document,
    content,
    fileName,
    inputs,
    progress
  )
  checkOk(c.length >= 0, 'No transpiler output generated')
  const res = await runGlass(c[0], {
    transcriptTokenCounter: {
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
