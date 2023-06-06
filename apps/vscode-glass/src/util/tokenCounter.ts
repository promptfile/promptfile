import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json'
import p50k_base from '@dqbd/tiktoken/encoders/p50k_base.json'
import r50k_base from '@dqbd/tiktoken/encoders/r50k_base.json'
import { Tiktoken } from '@dqbd/tiktoken/lite'
import { LANGUAGE_MODELS, parseGlassBlocks } from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'
import * as vscode from 'vscode'

const cl100k = new Tiktoken(cl100k_base.bpe_ranks, cl100k_base.special_tokens, cl100k_base.pat_str)
const r50k = new Tiktoken(r50k_base.bpe_ranks, r50k_base.special_tokens, r50k_base.pat_str)
const p50k = new Tiktoken(p50k_base.bpe_ranks, p50k_base.special_tokens, p50k_base.pat_str)

export function countTokens(text: string, model?: string) {
  let encoder: Tiktoken
  if (model == null) {
    encoder = cl100k
  } else {
    const encoding = modelEncodings[model]
    if (encoding === 'cl100k_base') {
      encoder = cl100k
    } else if (encoding === 'r50k_base') {
      encoder = r50k
    } else if (encoding === 'p50k_base') {
      encoder = p50k
    } else {
      encoder = cl100k
    }
  }

  const tokens = encoder.encode(text)
  return tokens.length
}

export function maxTokensForModel(model: string) {
  const m = LANGUAGE_MODELS.find(m => m.name === model)
  checkOk(m, `Could not find language model for ${model}`)
  return m.maxTokens
}

export function updateTokenCount(counter: vscode.StatusBarItem) {
  const editor = vscode.window.activeTextEditor
  if (editor) {
    const document = editor.document
    const fullText = document.getText()
    const initialBlocks = parseGlassBlocks(fullText)
    const promptBlocks = initialBlocks.filter(
      block => block.tag && ['System', 'User', 'Assistant', 'Block'].includes(block.tag)
    )
    const promptText = promptBlocks.map(block => block.child?.content ?? '').join('\n\n')
    try {
      const fullTextTokens = countTokens(promptText)
      let selectedTextTokensCount = 0

      const counterParts: string[] = [`${fullTextTokens} prompt token${fullTextTokens === 1 ? '' : 's'}`]

      // Check if there is a selection
      if (!editor.selection.isEmpty) {
        const selectedText = document.getText(editor.selection)
        selectedTextTokensCount = countTokens(selectedText)
        counterParts.push(`(${selectedTextTokensCount} selected)`)
      }

      counter.text = counterParts.join(' ')
      counter.show()
    } catch {
      // TODO: handle error
    }
  }
}

const modelEncodings: Record<string, string> = {
  'text-davinci-003': 'p50k_base',
  'text-davinci-002': 'p50k_base',
  'text-davinci-001': 'r50k_base',
  'text-curie-001': 'r50k_base',
  'text-babbage-001': 'r50k_base',
  'text-ada-001': 'r50k_base',
  davinci: 'r50k_base',
  curie: 'r50k_base',
  babbage: 'r50k_base',
  ada: 'r50k_base',
  'code-davinci-002': 'p50k_base',
  'code-davinci-001': 'p50k_base',
  'code-cushman-002': 'p50k_base',
  'code-cushman-001': 'p50k_base',
  'davinci-codex': 'p50k_base',
  'cushman-codex': 'p50k_base',
  'text-davinci-edit-001': 'p50k_edit',
  'code-davinci-edit-001': 'p50k_edit',
  'text-embedding-ada-002': 'cl100k_base',
  'text-similarity-davinci-001': 'r50k_base',
  'text-similarity-curie-001': 'r50k_base',
  'text-similarity-babbage-001': 'r50k_base',
  'text-similarity-ada-001': 'r50k_base',
  'text-search-davinci-doc-001': 'r50k_base',
  'text-search-curie-doc-001': 'r50k_base',
  'text-search-babbage-doc-001': 'r50k_base',
  'text-search-ada-doc-001': 'r50k_base',
  'code-search-babbage-code-001': 'r50k_base',
  'code-search-ada-code-001': 'r50k_base',
  gpt2: 'gpt2',
  'gpt-3.5-turbo': 'cl100k_base',
  'gpt-3.5-turbo-0301': 'cl100k_base',
  'gpt-4': 'cl100k_base',
  'gpt-4-0314': 'cl100k_base',
  'gpt-4-32k': 'cl100k_base',
  'gpt-4-32k-0314': 'cl100k_base',
}
