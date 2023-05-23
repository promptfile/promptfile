import { parseGlassFrontmatter } from '@glass-lang/glassc'
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
    const frontmatter = parseGlassFrontmatter(textDocument.getText()) as any[]
    const diagnostics: Diagnostic[] = []
    for (const f of frontmatter) {
      if (f.name === 'language') {
        if (!['python', 'javascript', 'typescript'].includes(f.type)) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range,
            message: `Unsupported language: ${f.type}`,
            source: 'glass',
          })
        }
      } else {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range,
          message: `Unsupported frontmatter key: ${f.name}`,
          source: 'glass',
        })
      }
    }
    return diagnostics
  } catch {
    return []
  }
}
