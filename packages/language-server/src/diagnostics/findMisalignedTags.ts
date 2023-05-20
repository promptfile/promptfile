import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findMisalignedTags(textDocument: TextDocument): Diagnostic[] {
  const text = textDocument.getText()
  const misalignedBlocks: { start: number; end: number }[] = []

  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip comment lines
    if (line.startsWith('//')) continue

    // Look for <User|Assistant|System|Prompt|Code> opening tags not at the start of a line
    const openingTagMatch = line.match(/^(?!<)\s*<(User|Assistant|System|Prompt|Code|Chat)(\s+[^>]*)?>/)

    if (openingTagMatch && openingTagMatch.index) {
      const start = lines.slice(0, i).join('\n').length + openingTagMatch.index
      const end = start + openingTagMatch[0].length
      misalignedBlocks.push({ start, end })
    }

    // Look for </User|Assistant|System|Prompt|Code> closing tags not at the start of a line
    const closingTagMatch = line.match(/^(?!<)\s*<\/(User|Assistant|System|Prompt|Code|Chat)>/)

    if (closingTagMatch && closingTagMatch.index) {
      const start = lines.slice(0, i).join('\n').length + closingTagMatch.index
      const end = start + closingTagMatch[0].length
      misalignedBlocks.push({ start, end })
    }
  }

  return misalignedBlocks.map(({ start, end }) => {
    const range = {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(end),
    }

    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range,
      message: `Tags must be on their own lines.`,
      source: 'glass',
    }

    return diagnostic
  })
}
