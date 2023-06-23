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
import { runPlaygroundAnthropic } from './runPlaygroundAnthropic'

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

export async function runPlayground(
  content: string,
  inputs: any,
  progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
) {
  const metadata = parseGlassMetadata(content)
  const blocks = parseChatBlocks(content)
  if (metadata.interpolationVariables.length === 0 && Object.keys(inputs).length > 0) {
    const newUserValue = inputs[Object.keys(inputs)[0]]
    const newUserBlock: ChatBlock = {
      role: 'user',
      content: newUserValue.trim(),
    }
    blocks.push(newUserBlock)
  }
  const parsedFrontmater = parseFrontmatterFromGlass(content)
  const model = parsedFrontmater?.model || vscode.workspace.getConfiguration('prompt').get('defaultModel')
  const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()
  if (!languageModel || !model) {
    await vscode.window.showErrorMessage(`Unable to find model ${model}`)
    return
  }
  for (const variable of metadata.interpolationVariables) {
    const value = inputs[variable] ?? ''
    content = content.replace(`@{${variable}}`, value)
  }
  switch (languageModel.creator) {
    case LanguageModelCreator.anthropic:
      if (anthropicKey == null || anthropicKey === '') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'prompt.anthropicKey')
        await vscode.window.showErrorMessage('Add Anthropic API key to run `.prompt` file.')
        return
      }
      return runPlaygroundAnthropic(blocks, anthropicKey, model, {
        progress,
      })
    case LanguageModelCreator.openai:
      if (openaiKey == null || openaiKey === '') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'prompt.openaiKey')
        await vscode.window.showErrorMessage('Add OpenAI API key to run `.prompt` file.')
        return
      }
      throw new Error('OpenAI not yet supported')
  }
}
