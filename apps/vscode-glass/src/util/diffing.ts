import * as diff from 'diff'
import * as vscode from 'vscode'

export async function updateTextDocumentWithDiff(document: vscode.TextDocument, newGlass: string): Promise<void> {
  const oldContent = document.getText()

  if (oldContent === newGlass) {
    return
  }

  // Calculate the diff between old and new contents
  const changes = diff.diffLines(oldContent, newGlass)

  const edits = new vscode.WorkspaceEdit()

  let lineCounter = 0
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    if (change.removed && changes[i + 1] && changes[i + 1].added) {
      const delText = change.value
      const lines = delText.split('\n').length - (delText.endsWith('\n') ? 1 : 0)
      const start = new vscode.Position(lineCounter, 0)
      lineCounter += lines
      const newText = changes[i + 1].value
      const end = new vscode.Position(lineCounter, 0)
      const range = new vscode.Range(start, end)
      edits.replace(document.uri, range, newText)
      lineCounter += newText.split('\n').length - (newText.endsWith('\n') ? 1 : 0)
      i++ // skip next change
    } else if (change.removed) {
      const delText = change.value
      const lines = delText.split('\n').length - (delText.endsWith('\n') ? 1 : 0)
      const start = new vscode.Position(lineCounter, 0)
      lineCounter += lines
      const end = new vscode.Position(lineCounter, 0)
      const range = new vscode.Range(start, end)
      edits.delete(document.uri, range)
    } else if (change.added) {
      const newText = change.value
      const position = new vscode.Position(lineCounter, 0)
      edits.insert(document.uri, position, newText)
      lineCounter += newText.split('\n').length - (newText.endsWith('\n') ? 1 : 0)
    } else {
      lineCounter += change.count || 0
    }
  }

  // Apply the edits to the document
  await vscode.workspace.applyEdit(edits)
}
