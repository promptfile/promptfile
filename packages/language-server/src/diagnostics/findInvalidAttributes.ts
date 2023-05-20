import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findInvalidAttributes(textDocument: TextDocument): Diagnostic[] {
  const text = textDocument.getText()
  const invalidAttributes: { tag: string; attribute: string; start: number }[] = []

  const tagRegex = /<(\w+)(\s+[^>]*)?>/g
  let tagMatch
  while ((tagMatch = tagRegex.exec(text))) {
    const tagName = tagMatch[1]
    const attributesStr = tagMatch[2]

    if (attributesStr) {
      const attributeRegex = /\s*(\w+)(?:\s*=\s*"([^"]*)")?/g
      let attributeMatch
      while ((attributeMatch = attributeRegex.exec(attributesStr))) {
        const attributeName = attributeMatch[1]

        const lookup: Record<string, string[]> = {
          Block: ['role', 'content'],
          For: ['each', 'fragment'],
          Chat: ['model'],
          Completion: ['model'],
          User: ['name'],
          Assistant: ['name'],
          Code: ['language'],
        }

        const isInvalidAttribute = !lookup[tagName] || !lookup[tagName].includes(attributeName)

        if (isInvalidAttribute) {
          invalidAttributes.push({
            tag: tagName,
            attribute: attributeName,
            start: tagMatch.index + tagMatch[0].indexOf(attributeName),
          })
        }
      }
    }
  }

  return invalidAttributes.map(({ tag, attribute, start }) => {
    const range = {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(start + attribute.length),
    }

    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range,
      message: `Invalid attribute "${attribute}" for <${tag}> tag.`,
      source: 'glass',
    }

    return diagnostic
  })
}
