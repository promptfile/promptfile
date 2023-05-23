import * as vscode from 'vscode'
import { isGlassFile } from './isGlassFile'

export async function updateLanguageMode(textDocument: vscode.TextDocument) {
  if (!isGlassFile(textDocument)) {
    return
  }
  console.log('OMG!')
  try {
    if (textDocument.languageId === 'glass') {
      console.log('no need to update')
      return
    }
    console.log('updating...')
    await vscode.languages.setTextDocumentLanguage(textDocument, 'glass')
  } catch {
    // ignore
  }
}
