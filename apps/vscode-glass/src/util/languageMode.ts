import { parseGlassFrontmatter } from '@glass-lang/glasslib'
import * as vscode from 'vscode'
import { isGlassFile } from './isGlassFile'

export async function updateLanguageMode(textDocument: vscode.TextDocument) {
  if (!isGlassFile(textDocument)) {
    return
  }
  let targetLanguage = 'glass-ts'
  try {
    // Extract the frontmatter from the beginning of the document
    const frontmatter = parseGlassFrontmatter(textDocument.getText())

    const languageFrontmatter = frontmatter.find((f: any) => f.name === 'language')
    if (languageFrontmatter) {
      if (languageFrontmatter.type === 'python') {
        targetLanguage = 'glass-py'
      } else if (languageFrontmatter.type === 'javascript') {
        targetLanguage = 'glass-js'
      } else if (languageFrontmatter.type === 'typescript') {
        targetLanguage = 'glass-ts'
      }
    }
  } catch (error) {
    console.log(error)
  }

  if (textDocument.languageId !== targetLanguage) {
    await vscode.languages.setTextDocumentLanguage(textDocument, targetLanguage)
  }
}
