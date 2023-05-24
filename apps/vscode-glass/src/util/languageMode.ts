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

    const languageFrontmatter = frontmatter.find((f: any) => f.name === 'language')
    if (languageFrontmatter && languageFrontmatter.type) {
      targetLanguage = lookup[languageFrontmatter.type]
    }
  } catch (error) {
    console.log(error)
  }

  if (targetLanguage && textDocument.languageId !== targetLanguage) {
    await vscode.languages.setTextDocumentLanguage(textDocument, targetLanguage)
  }
}
