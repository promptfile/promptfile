import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findMultiplePromptBlocks(textDocument: TextDocument): Diagnostic[] {
  const text = textDocument.getText()
  const promptBlocks: { start: number; end: number }[] = []

  // Match Prompt blocks that are not preceded by // on the same line
  const blockRegex = /(^|[\r\n]+)\s*(?!\/\/)<(Prompt)(\s+[^>]*)?>[\s\S]*?<\/\2>/g
  let blockMatch
  while ((blockMatch = blockRegex.exec(text))) {
    const blockStart = blockMatch.index
    const blockEnd = blockMatch.index + blockMatch[0].length

    promptBlocks.push({ start: blockStart, end: blockEnd })
  }

  // If there is only one or no Prompt block, it's not an issue.
  if (promptBlocks.length <= 1) {
    return []
  }

  // If there are multiple Prompt blocks, return all but the first one.
  return promptBlocks.slice(1).map(({ start, end }) => {
    const range = {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(end),
    }
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range,
      message: `Only one <Prompt> block allowed per file.`,
      source: 'glass',
    }

    return diagnostic
  })
}
