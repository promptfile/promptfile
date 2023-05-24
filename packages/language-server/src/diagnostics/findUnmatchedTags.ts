import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findUnmatchedTags(textDocument: TextDocument): Diagnostic[] {
  const unmatchedTags = extractUnmatchedTags(textDocument.getText())
  return unmatchedTags.map(({ tag, start }) => {
    const tagName = tag.startsWith('/') ? tag.slice(1) : tag
    const range = {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(start + tagName.length + (tag.startsWith('/') ? 3 : 2)),
    }
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range,
      message: `<${tagName}> tag requires a closing </${tagName}> tag.`,
      source: 'glass',
    }

    return diagnostic
  })
}

export function extractUnmatchedTags(text: string) {
  const tagPattern = /^<\/?(Code|User|System|Assistant|Prompt|State|Chat|Test)(\s+[^>]*)?>/gm
  const tagStack: { tag: string; start: number }[] = []
  const unmatchedTags: { tag: string; start: number }[] = []

  let match
  while ((match = tagPattern.exec(text))) {
    const isOpeningTag = match[0][1] !== '/'
    const tag = match[1]

    if (isOpeningTag) {
      tagStack.push({ tag, start: match.index })
    } else {
      const lastOpeningTag = tagStack.pop()
      if (!lastOpeningTag || lastOpeningTag.tag !== tag) {
        if (lastOpeningTag) {
          unmatchedTags.push(lastOpeningTag)
          tagStack.push(lastOpeningTag)
        }
        unmatchedTags.push({ tag: `/${tag}`, start: match.index })
      }
    }
  }

  // Add any remaining unmatched opening tags
  unmatchedTags.push(...tagStack)
  return unmatchedTags
}
