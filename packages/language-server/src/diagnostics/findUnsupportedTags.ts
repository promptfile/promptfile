import { parseGlassTopLevelJsxElements } from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { glassElements } from '../elements'

export function findUnsupportedTags(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const unsupportedTags = parsed.filter(tag => !glassElements.some(element => element.name === tag.tagName))
    return unsupportedTags.map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `Unsupported <${tag.tagName}> tag.`,
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}
