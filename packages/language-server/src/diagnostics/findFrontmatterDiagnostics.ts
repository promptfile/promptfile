import { parseFrontmatterFromGlass } from '@glass-lang/glassc'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findFrontmatterDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
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
    const frontmatter = parseFrontmatterFromGlass(textDocument.getText()) as any | null
    const diagnostics: Diagnostic[] = []
    if (frontmatter) {
      if (frontmatter.language && !['python', 'javascript', 'typescript'].includes(frontmatter.language)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range,
          message: `Unsupported language: ${frontmatter.language}`,
          source: 'glass',
        })
      }
    }
    return diagnostics
  } catch {
    return []
  }
}
