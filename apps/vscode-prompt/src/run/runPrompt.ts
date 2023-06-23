import {
  ChatBlock,
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseChatBlocks,
  parseFrontmatterFromGlass,
  parseGlassMetadata,
} from '@glass-lang/glasslib'
import * as vscode from 'vscode'

import { getAnthropicKey, getOpenaiKey } from '../util/keys'

export async function runPrompt(
  outputChannel: vscode.OutputChannel,
  content: string,
  inputs: any,
  progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
) {
  const parsedFrontmater = parseFrontmatterFromGlass(content)
  const model = parsedFrontmater?.model || vscode.workspace.getConfiguration('prompt').get('defaultModel')
  const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()
  if (!languageModel) {
    await vscode.window.showErrorMessage(`Unable to find model ${model}`)
    return
  }
  switch (languageModel.creator) {
    case LanguageModelCreator.anthropic:
      if (anthropicKey == null || anthropicKey === '') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'prompt.anthropicKey')
        await vscode.window.showErrorMessage('Add Anthropic API key to run `.prompt` file.')
        return
      }
      break
    case LanguageModelCreator.openai:
      if (openaiKey == null || openaiKey === '') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'prompt.openaiKey')
        await vscode.window.showErrorMessage('Add OpenAI API key to run `.prompt` file.')
        return
      }
      break
  }

  const blocks = parseChatBlocks(content)
  const metadata = parseGlassMetadata(content)
  const variables = metadata.interpolationVariables

  return ''
}
