import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findUnsupportedTags(textDocument: TextDocument): Diagnostic[] {
  const tagPattern = /^<\/?([\w-]+).*?>/gm
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
  const unsupportedTags: { tag: string; start: number }[] = []

  let match
  while ((match = tagPattern.exec(textDocument.getText()))) {
    const tag = match[1]

    if (!supportedTags.has(tag)) {
      unsupportedTags.push({ tag, start: match.index })
    }
  }

  return unsupportedTags.map(({ tag, start }) => {
    const range = {
      start: textDocument.positionAt(start + 1),
      end: textDocument.positionAt(start + tag.length + 1),
    }

    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range,
      message: `Unsupported ${tag} tag.`,
      source: 'glass',
    }

    return diagnostic
  })
}
