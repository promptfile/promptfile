import * as vscode from 'vscode'

export function isGlassFile(document: vscode.TextDocument) {
  return document.fileName.endsWith('.glass')
}

export function getDocumentFilename(document: vscode.TextDocument) {
  return document.fileName.split('/').pop()
}
