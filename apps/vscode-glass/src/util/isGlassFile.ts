import * as vscode from 'vscode'

export function isGlassFile(document: vscode.TextDocument) {
  return ['glass-ts', 'glass-js', 'glass-py'].includes(document.languageId)
}

export function hasGlassFileOpen(editor: vscode.TextEditor) {
  return isGlassFile(editor.document)
}

export function getDocumentFilename(document: vscode.TextDocument) {
  return document.fileName.split('/').pop()!
}

export async function getAllGlassFiles(): Promise<vscode.TextDocument[]> {
  const glassFilePattern = '**/*.glass'
  const excludePattern = '**/.glasslog/**' // exclude any .glass files in .glasslog folder

  const files = await vscode.workspace.findFiles(glassFilePattern, excludePattern)
  const glassTextDocuments = await Promise.all(files.map(file => vscode.workspace.openTextDocument(file)))
  return glassTextDocuments.filter(document => isGlassFile(document))
}
