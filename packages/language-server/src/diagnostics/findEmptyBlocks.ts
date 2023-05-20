import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findEmptyBlocks(textDocument: TextDocument): Diagnostic[] {
  const emptyBlocks: { tag: string; start: number; end: number }[] = []

  const blockRegex = /<(User|Assistant|System|Prompt|Code|Text)(\s+[^>]*)?>\s*<\/\1>/g
  let blockMatch
  while ((blockMatch = blockRegex.exec(textDocument.getText()))) {
    const blockStart = blockMatch.index
    const blockEnd = blockMatch.index + blockMatch[0].length
    const tag = blockMatch[1]

    emptyBlocks.push({ tag, start: blockStart, end: blockEnd })
  }

  return emptyBlocks.map(({ tag, start, end }) => {
    const range = {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(end),
    }

    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range,
      message: `Empty <${tag}> block.`,
      source: 'glass',
    }

    return diagnostic
  })
}
