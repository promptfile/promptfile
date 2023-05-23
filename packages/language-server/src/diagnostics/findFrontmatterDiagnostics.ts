import { parseGlassFrontmatter } from '@glass-lang/glassc'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findFrontmatterDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const frontmatter = parseGlassFrontmatter(textDocument.getText())
    if (!frontmatter) {
      return []
    }
    // get the range of the frontmatter
    const regex = /---\n([\s\S]*?)\n---/
    const match = regex.exec(textDocument.getText())
    if (!match) {
      return []
    }
    const range = {
      start: textDocument.positionAt(match.index),
      end: textDocument.positionAt(match.index + match[0].length),
    }
    const diagnostics: Diagnostic[] = []
    const keys = Object.keys(frontmatter)
    for (const key of keys) {
      if (key === 'language') {
        if (!['python', 'javascript', 'typescript'].includes(frontmatter[key])) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range,
            message: `Unsupported language: ${frontmatter[key]}`,
            source: 'glass',
          })
        }
      } else {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range,
          message: `Unsupported frontmatter key: ${key}`,
          source: 'glass',
        })
      }
    }
    return diagnostics
  } catch {
    return []
  }
}
