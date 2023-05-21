import { parseGlassTopLevelJsxElements } from '@glass-lang/glassc'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findEmptyBlocks(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const tagsToCheck = new Set(['Assistant', 'Code', 'Prompt', 'System', 'Text', 'User'])
    const emptyTags = parsed.filter(
      tag =>
        tagsToCheck.has(tag.tagName) &&
        (tag.children.length === 0 || (tag.length === 1 && tag.children[0].length === 0))
    )
    console.log(emptyTags.map(tag => tag.children))
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
