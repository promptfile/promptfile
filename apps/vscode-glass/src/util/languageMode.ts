import { parseGlassFrontmatter } from '@glass-lang/glassc'
import * as vscode from 'vscode'
import { isGlassFile } from './isGlassFile'

export async function updateLanguageMode(textDocument: vscode.TextDocument) {
  if (!isGlassFile(textDocument)) {
    return
  }
  let targetLanguage = 'glass'
  try {
    // Extract the frontmatter from the beginning of the document
    const frontmatter = parseGlassFrontmatter(textDocument.getText())

    // Look for the 'language' argument
    const languageFrontmatter = frontmatter?.language
    if (languageFrontmatter && languageFrontmatter === 'python') {
      targetLanguage = 'glass-py'
    }
  } catch (error) {
    console.log(error)
  }

  if (textDocument.languageId !== targetLanguage) {
    await vscode.languages.setTextDocumentLanguage(textDocument, targetLanguage)
  }
}
