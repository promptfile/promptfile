import { parseGlassTopLevelJsxElements } from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findInvalidPromptBlocks(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const promptBlocks = parsed.filter(tag => tag.tagName === 'Prompt')
    if (promptBlocks.length === 0) {
      return []
    }
    const chatBlocks = parsed.filter(tag => ['User', 'Assistant', 'System', 'Block'].includes(tag.tagName))
    if (chatBlocks.length === 0) {
      return []
    }
    return promptBlocks.map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `<Prompt> blocks can't be mixed with <User>, <Assistant>, and <System> blocks.`,
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}
