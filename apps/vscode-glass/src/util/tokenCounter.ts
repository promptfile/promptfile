import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken } from '@dqbd/tiktoken/lite'
import * as vscode from 'vscode'

export function updateTokenCount(counter: vscode.StatusBarItem) {
  const editor = vscode.window.activeTextEditor
  if (editor) {
    const document = editor.document
    const text = document.getText()

    // Instantiate a new encoder
    const encoder = new Tiktoken(cl100k_base.bpe_ranks, cl100k_base.special_tokens, cl100k_base.pat_str)

    // Get tokens
    const tokens = encoder.encode(text)

    // Free the encoder after use
    encoder.free()

    counter.text = `${tokens.length} token${tokens.length === 1 ? '' : 's'}`
    counter.show()
  }
}
