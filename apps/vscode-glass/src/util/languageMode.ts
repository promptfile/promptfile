import { parseFrontmatterFromGlass } from '@glass-lang/glassc'
import * as vscode from 'vscode'
import { isGlassFile } from './isGlassFile'

export async function updateLanguageMode(textDocument: vscode.TextDocument) {
  if (!isGlassFile(textDocument)) {
    return
  }

  const lookup: Record<string, string> = {
    typescript: 'glass-ts',
    javascript: 'glass-js',
    python: 'glass-py',
  }

  const targetLanguageName =
    (vscode.workspace.getConfiguration('glass').get('defaultLanguageMode') as string | undefined) ?? 'glass-ts'
  let targetLanguage = lookup[targetLanguageName]

  try {
    // Extract the frontmatter from the beginning of the document
    const frontmatter = parseFrontmatterFromGlass(textDocument.getText())
    if (frontmatter && frontmatter.language) {
      targetLanguage = lookup[frontmatter.language]
    }
  } catch (error) {
    console.error(error)
  }

  if (targetLanguage && textDocument.languageId !== targetLanguage) {
    await vscode.languages.setTextDocumentLanguage(textDocument, targetLanguage)
  }
}
