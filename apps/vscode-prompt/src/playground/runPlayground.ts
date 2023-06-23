import {
  ChatBlock,
  LANGUAGE_MODELS,
  LanguageModelCreator,
  constructGlassDocument,
  parseChatBlocks,
  parseFrontmatterFromGlass,
  parseGlassMetadata,
} from '@glass-lang/glasslib'
import { FunctionData } from '@glass-lang/glasslib/dist/parseGlassBlocks'
import fetch from 'node-fetch'
import * as vscode from 'vscode'
import { getAnthropicKey, getOpenaiKey } from '../util/keys'
import { runPlaygroundAnthropic } from './runPlaygroundAnthropic'
import { runPlaygroundOpenAI } from './runPlaygroundOpenAI'

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
  const parsedFrontmater = parseFrontmatterFromGlass(content)
  const model = parsedFrontmater?.model || vscode.workspace.getConfiguration('prompt').get('defaultModel')
  if (!model) {
    await vscode.window.showErrorMessage('No model specified in frontmatter or defaultModel setting.')
    return
  }
  if (metadata.interpolationVariables.length === 0 && Object.keys(inputs).length > 0) {
    const newUserValue = inputs[Object.keys(inputs)[0]]
    const newUserBlock: ChatBlock = {
      role: 'user',
      content: newUserValue.trim(),
    }
    blocks.push(newUserBlock)
    content = constructGlassDocument(blocks, model)
    if (progress) {
      progress({
        nextGlassfile: content,
        response: [newUserBlock],
      })
    }
  }

  const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()
  if (!languageModel) {
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
      const functionEndpoint: string = vscode.workspace.getConfiguration('prompt').get('functionEndpoint') as any

      return runPlaygroundOpenAI(blocks, openaiKey, model, [], {
        progress,
        getFunction: async (name: string) => {
          const res = await fetch(`${functionEndpoint}/${name}`, {
            method: 'GET',
          })
          return (await res.json()) as any
        },
        execFunction: async (name: string, args: any) => {
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
  }
}
