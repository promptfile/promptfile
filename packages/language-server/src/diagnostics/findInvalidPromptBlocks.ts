import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findInvalidPromptBlocks(textDocument: TextDocument): Diagnostic[] {
  const text = textDocument.getText()
  const promptBlocks: { start: number; end: number }[] = []
  const userSystemAssistantBlocks: { start: number; end: number }[] = []

  // Match Prompt blocks that are not preceded by // on the same line
  const promptBlockRegex = /^(?!\/\/).*<(Prompt)(\s+[^>]*)?>[\s\S]*?<\/\1>/gm

  // Match User/System/Assistant blocks that are not preceded by // on the same line
  const userSystemAssistantBlockRegex = /^(?!\/\/).*<(User|System|Assistant)(\s+[^>]*)?>[\s\S]*?<\/\1>/gm

  let blockMatch
  while ((blockMatch = promptBlockRegex.exec(text))) {
    const blockStart = blockMatch.index
    const blockEnd = blockMatch.index + blockMatch[0].length

    promptBlocks.push({ start: blockStart, end: blockEnd })
  }

  while ((blockMatch = userSystemAssistantBlockRegex.exec(text))) {
    const blockStart = blockMatch.index
    const blockEnd = blockMatch.index + blockMatch[0].length

    userSystemAssistantBlocks.push({ start: blockStart, end: blockEnd })
  }

  // If there are Prompt blocks and User/System/Assistant blocks, return the Prompt blocks as invalid
  if (promptBlocks.length > 0 && userSystemAssistantBlocks.length > 0) {
    return promptBlocks.map(({ start, end }) => {
      const range = {
        start: textDocument.positionAt(start),
        end: textDocument.positionAt(end),
      }
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range,
        message: `<Prompt> blocks can't be mixed with <User>, <Assistant>, and <System> blocks.`,
        source: 'glass',
      }

      return diagnostic
    })
  }

  // If there are no Prompt blocks or no User/System/Assistant blocks, return an empty array
  return []
}
