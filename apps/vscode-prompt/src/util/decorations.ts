import * as vscode from 'vscode'

export function updateDecorations(activeEditor: vscode.TextEditor, decorations: vscode.TextEditorDecorationType) {
  if (!activeEditor) {
    return
  }

  const regEx = /^<(User|Assistant|System|Function|Block)(.*)>\n([\s\S]*?)^\s*<\/\1>$/gm
  const text = activeEditor.document.getText()
  const highlights: vscode.Range[] = []

  let match: RegExpExecArray | null

  while ((match = regEx.exec(text))) {
    const startPos = activeEditor.document.positionAt(match.index)
    const endPos = activeEditor.document.positionAt(match.index + match[0].length)

    // Update the start position to the next line after the opening tag
    const contentStartPosition = startPos.with({ line: startPos.line + 1, character: 0 })

    // Update the end position to the previous line before the closing tag
    const contentEndPosition = endPos.with({ line: endPos.line - 1, character: Number.MAX_SAFE_INTEGER })

    // Create a range for the content between the opening and closing tags
    const range = new vscode.Range(contentStartPosition, contentEndPosition)
    highlights.push(range)
  }

  activeEditor.setDecorations(decorations, highlights)
}
