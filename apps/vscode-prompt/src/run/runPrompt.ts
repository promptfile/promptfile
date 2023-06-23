import {
  ChatBlock,
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseChatBlocks,
  parseFrontmatterFromGlass,
  parseGlassMetadata,
} from '@glass-lang/glasslib'
import { FunctionData } from '@glass-lang/glasslib/dist/parseGlassBlocks'
import * as vscode from 'vscode'
import { getAnthropicKey, getOpenaiKey } from '../util/keys'
import { runPromptAnthropic } from './runPromptAnthropic'

export interface LLMResponse {
  content: string
  function_call?: { name: string; arguments: string } | null
}

export interface ResponseData {
  response: string
  function_call?: { name: string; arguments: string } | null
  functionObservation?: string
  requestTokens?: number
  responseTokens?: number
}

export interface TranspilerOutput {
  interpolatedDoc: string
  defaultModel?: string
  functions: FunctionData[]
}

export async function runPrompt(
  content: string,
  inputs: any,
  progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
) {
  const parsedFrontmater = parseFrontmatterFromGlass(content)
  const model = parsedFrontmater?.model || vscode.workspace.getConfiguration('prompt').get('defaultModel')
  const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()
  if (!languageModel || !model) {
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
  const metadata = parseGlassMetadata(content)
  for (const variable of metadata.interpolationVariables) {
    const value = inputs[variable] ?? ''
    content = content.replace(`@{${variable}}`, value)
  }
  const blocks = parseChatBlocks(content)
  return runPromptAnthropic(blocks, anthropicKey!, model, {
    progress,
  })
}
