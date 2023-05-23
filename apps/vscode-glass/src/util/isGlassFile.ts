import * as vscode from 'vscode'

export function isGlassFile(document: vscode.TextDocument) {
  return ['glass', 'glass-py'].includes(document.languageId)
}

export function hasGlassFileOpen(editor: vscode.TextEditor) {
  return isGlassFile(editor.document)
}

export function getDocumentFilename(document: vscode.TextDocument) {
  return document.fileName.split('/').pop()!
}

export function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
