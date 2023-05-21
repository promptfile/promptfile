import { parseGlassTopLevelJsxElements } from '@glass-lang/glassc'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findUnsupportedTags(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const supportedTags = new Set([
      'Args',
      'Assistant',
      'Block',
      'Chat',
      'Completion',
      'Code',
      'For',
      'Prompt',
      'System',
      'Text',
      'User',
    ])
    const unsupportedTags = parsed.filter(tag => !supportedTags.has(tag.tagName))
    return unsupportedTags.map(tag => {
      const range = {
        start: textDocument.positionAt(tag.position.start.offset),
        end: textDocument.positionAt(tag.position.end.offset),
      }

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range,
        message: `Unsupported <${tag.tagName}> tag.`,
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}
