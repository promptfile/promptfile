import * as vscode from 'vscode'

export function updateDecorations(activeEditor: vscode.TextEditor, decorations: vscode.TextEditorDecorationType) {
  if (!activeEditor) {
    return
  }

  const regEx = /^<(User|Assistant|System|Function|Block)>\n([\s\S]*?)^\s*<\/\1>$/gm // Updated regex
  const text = activeEditor.document.getText()
  const highlights = []

  let match = null

  while ((match = regEx.exec(text))) {
    const startPos = activeEditor.document.positionAt(match.index)
    const endPos = activeEditor.document.positionAt(match.index + match[0].length)

    // Update the start position to the next line after the opening tag
    const openingTagLine = startPos.line
    const contentStartLine = openingTagLine + 1
    const contentStartPosition = new vscode.Position(contentStartLine, 0)

    // Update the end position to the previous line before the closing tag
    const closingTagLine = endPos.line
    const contentEndLine = closingTagLine - 1
    const contentEndPosition = new vscode.Position(contentEndLine, Number.MAX_SAFE_INTEGER)

    // Create a range for the content between the opening and closing tags
    const range = new vscode.Range(contentStartPosition, contentEndPosition)
    highlights.push(range)
  }

  activeEditor.setDecorations(decorations, highlights)
}
