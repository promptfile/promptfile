import { parseGlassAST } from '@glass-lang/glassc'
import * as vscode from 'vscode'
import { isGlassFile } from './isGlassFile'

export async function updateLanguageMode(textDocument: vscode.TextDocument) {
  if (!isGlassFile(textDocument)) {
    return
  }
  try {
    const ast = parseGlassAST(textDocument.getText())
    const frontmatterArgs = ast.frontmatterArgs
    const languageFrontmatter = frontmatterArgs.find(arg => arg.name === 'language')
    let targetLanguage = 'glass'
    if (languageFrontmatter && languageFrontmatter.type === 'python') {
      targetLanguage = 'glass-py'
    }
    if (textDocument.languageId !== targetLanguage) {
      await vscode.languages.setTextDocumentLanguage(textDocument, targetLanguage)
    }
  } catch {
    // ignore
  }
}
