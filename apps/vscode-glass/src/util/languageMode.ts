import { parseGlassAST } from '@glass-lang/glassc'
import * as vscode from 'vscode'
import { isGlassFile } from './isGlassFile'

export async function updateLanguageMode(textDocument: vscode.TextDocument) {
  if (!isGlassFile(textDocument)) {
    return
  }
  console.log('OMG!')
  try {
    const ast = parseGlassAST(textDocument.getText())
    const frontmatterArgs = ast.frontmatterArgs
    const languageFrontmatter = frontmatterArgs.find(arg => arg.name === 'language')
    let targetLanguage = 'glass'
    console.log('frontmatter', ast.frontmatterArgs)
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
