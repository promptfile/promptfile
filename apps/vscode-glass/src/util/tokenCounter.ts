import { countTokens } from '@glass-lang/glassc'
import { parseGlassBlocks } from '@glass-lang/glasslib'
import * as vscode from 'vscode'

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
