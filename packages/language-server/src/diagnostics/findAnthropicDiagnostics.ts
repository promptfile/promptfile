import { parseGlassTopLevelJsxElements } from '@glass-lang/glassc'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findAnthropicDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const chatElement = parsed.find(tag => tag.tagName === 'Chat')
    if (!chatElement) {
      return []
    }
    const model = chatElement.attrs.find(attr => attr.name === 'model')
    if (!model || !model.stringValue.startsWith('claude')) {
      return []
    }

    const systemBlocks = parsed.filter(tag => tag.tagName === 'System')
    return systemBlocks.map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `<System> blocks not supported by Anthropic — use <User> or <Assistant> instead.`,
        source: 'glass',
      }
      return diagnostic
    })
  } catch {
    return []
  }
}
