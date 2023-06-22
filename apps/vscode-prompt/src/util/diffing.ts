import * as vscode from 'vscode'

export async function updateTextDocumentWithDiff(document: vscode.TextDocument, newGlass: string): Promise<void> {
  const oldLines = document.getText().split('\n')
  const newLines = newGlass.split('\n')

  const edits = new vscode.WorkspaceEdit()

  const maxLength = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLength; i++) {
    if (oldLines[i] !== newLines[i]) {
      if (newLines[i] === undefined) {
        // The new document has fewer lines, delete the extra line.
        const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i + 1, 0))
        edits.delete(document.uri, range)
      } else if (oldLines[i] === undefined) {
        // The new document has more lines, insert the extra line.
        const position = new vscode.Position(i, 0)
        edits.insert(document.uri, position, newLines[i] + '\n')
      } else {
        // The lines are different, replace the old line.
        const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i + 1, 0))
        edits.replace(document.uri, range, newLines[i] + '\n')
      }
    }
  }

  // Apply the edits to the document.
  await vscode.workspace.applyEdit(edits)
}
