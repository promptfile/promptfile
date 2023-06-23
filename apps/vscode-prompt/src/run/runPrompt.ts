import { ChatBlock, parseGlassMetadata } from '@glass-lang/glasslib'
import * as vscode from 'vscode'

import { getAnthropicKey, getOpenaiKey } from '../util/keys'

export async function runPrompt(
  outputChannel: vscode.OutputChannel,
  document: vscode.TextDocument,
  inputs: any,
  progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
) {
  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()
  const text = document.getText()
  const metadata = parseGlassMetadata(text)
  return ''
}
