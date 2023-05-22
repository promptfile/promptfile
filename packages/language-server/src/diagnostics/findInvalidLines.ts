import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findInvalidLines(textDocument: TextDocument): Diagnostic[] {
  const invalidLines: { line: number; start: number; end: number }[] = []
  const lines = textDocument.getText().split('\n')

  let insideValidElement = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (
      line.startsWith('<User') ||
      line.startsWith('<Assistant') ||
      line.startsWith('<System') ||
      line.startsWith('<Prompt') ||
      line.startsWith('<Code') ||
      line.startsWith('<Text') ||
      line.startsWith('<Chat')
    ) {
      insideValidElement++
    }

    if (
      line.startsWith('</User>') ||
      line.startsWith('</Assistant>') ||
      line.startsWith('</System>') ||
      line.startsWith('</Prompt>') ||
      line.startsWith('</Code>') ||
      line.startsWith('</Text>') ||
      line.startsWith('</Chat>')
    ) {
      insideValidElement--
    }

    if (!insideValidElement && isInvalidLine(line)) {
      invalidLines.push({ line: i, start: 0, end: line.length })
    }
  }

  return invalidLines.map(({ line, start, end }) => {
    const range = {
      start: textDocument.positionAt(textDocument.offsetAt({ line, character: start })),
      end: textDocument.positionAt(textDocument.offsetAt({ line, character: end })),
    }

    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range,
      message: `Content not contained in a block — will be ignored by compiler.`,
      source: 'glass',
    }

    return diagnostic
  })
}

function isInvalidLine(line: string): boolean {
  const trimmedLine = line.trim()

  // Check if the line is a comment, import, or export line
  if (
    trimmedLine.length === 0 ||
    trimmedLine.startsWith('//') ||
    trimmedLine.startsWith('import') ||
    trimmedLine.startsWith('export') ||
    trimmedLine.startsWith('<For ') ||
    trimmedLine.startsWith('<Completion ') ||
    trimmedLine.startsWith('<Args ') ||
    trimmedLine.startsWith('<Block ')
  ) {
    return false
  }

  // Check if the line is inside a valid element or contains a valid element with attributes
  const openTagCount = (line.match(/^<(User|Assistant|System|Prompt|Code|Text|Chat|For)(\s+[^>]*)?>/g) || []).length
  const closeTagCount = (line.match(/^<\/(User|Assistant|System|Prompt|Code|Text|Chat|For)>/g) || []).length

  return openTagCount === 0 && closeTagCount === 0
}
