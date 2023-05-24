import { parseGlassTopLevelJsxElements } from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { glassElements } from '../elements'

export function findEmptyBlocks(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const tagsToCheck = glassElements.filter(e => e.selfClosing !== true).map(e => e.name)
    const emptyTags = parsed.filter(
      tag =>
        tagsToCheck.includes(tag.tagName) &&
        (tag.children.length === 0 || (tag.length === 1 && tag.children[0].length === 0))
    )
    return emptyTags.map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `Empty <${tag.tagName}> tag.`,
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}
