import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken } from '@dqbd/tiktoken/lite'
import * as vscode from 'vscode'

const encoding = new Tiktoken(cl100k_base.bpe_ranks, cl100k_base.special_tokens, cl100k_base.pat_str)

export function updateTokenCount(counter: vscode.StatusBarItem) {
  const editor = vscode.window.activeTextEditor
  if (editor) {
    const document = editor.document
    const fullText = document.getText()

    const fullTextTokens = encoding.encode(fullText)
    let selectedTextTokensCount = 0

    const counterParts: string[] = [`${fullTextTokens.length} token${fullTextTokens.length === 1 ? '' : 's'}`]

    // Check if there is a selection
    if (!editor.selection.isEmpty) {
      const selectedText = document.getText(editor.selection)
      selectedTextTokensCount = encoding.encode(selectedText).length
      counterParts.push(`(${selectedTextTokensCount} selected)`)
    }

    counter.text = counterParts.join(' ')
    counter.show()
  }
}
