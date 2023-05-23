import { parseGlassTopLevelJsxElements } from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findMultiplePromptBlocks(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const promptBlocks = parsed.filter(tag => tag.tagName === 'Prompt')
    if (promptBlocks.length <= 1) {
      return []
    }
    return promptBlocks.slice(1).map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `Only one <Prompt> block allowed per file.`,
        source: 'glass',
      }
      return diagnostic
    })
  } catch {
    return []
  }
}
