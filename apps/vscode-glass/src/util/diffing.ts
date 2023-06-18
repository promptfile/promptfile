import * as diff from 'diff'
import * as vscode from 'vscode'

export async function updateTextDocumentWithDiff(document: vscode.TextDocument, newGlass: string): Promise<void> {
  const oldContent = document.getText()
  // Calculate the diff between old and new contents
  const changes = diff.diffLines(oldContent.trim(), newGlass.trim())
  console.log('changes', changes)

  // Create a new WorkspaceEdit
  const edits = new vscode.WorkspaceEdit()

  // Initialize the line counter
  let line = 0

  // Iterate through the changes and create TextEdits
  for (const change of changes) {
    if (change.added) {
      // Add the new lines
      const range = new vscode.Range(line, 0, line, 0)
      edits.replace(document.uri, range, change.value)
      line += change.count || 0
    } else if (change.removed) {
      // Remove the old lines
      const range = new vscode.Range(line, 0, line + (change.count || 0), 0)
      edits.delete(document.uri, range)
    } else {
      // No change, move the line counter forward
      line += change.count || 0
    }
  }

  // Apply the edits to the document
  await vscode.workspace.applyEdit(edits)
}
