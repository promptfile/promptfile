import { CompletionItem, CompletionItemKind, InsertTextFormat, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { extractUnmatchedTags } from './diagnostics/findUnmatchedTags'
import { glassElements } from './elements'

export function generateCompletions(document: TextDocument, textDocumentPosition: TextDocumentPositionParams) {
  const completionItems: CompletionItem[] = []

  for (const element of glassElements) {
    const requiredAttributes = element.attributes.filter(a => a.optional !== true)
    const attributesToInsert: string[] = requiredAttributes.map((attribute, index) => {
      const cursorIndex = index + 1
      const attributeValue =
        attribute.values && attribute.values.length > 0
          ? `"\${${cursorIndex}|${attribute.values.sort().join(',')}|}"`
          : attribute.type === 'boolean'
          ? `\${${cursorIndex}|true,false|}`
          : attribute.type === 'string'
          ? `"$${cursorIndex}"`
          : `\$${cursorIndex}`
      return ` ${attribute.name}=${attributeValue}`
    })
    completionItems.push({
      label: element.name,
      kind: CompletionItemKind.Property,
      detail: element.detail,
      documentation: element.documentation
        ? {
            kind: 'markdown',
            value: element.documentation,
          }
        : undefined,
      insertText: element.insertText ?? `${element.name}${attributesToInsert.join('')}>\n$0\n</${element.name}>`,
      insertTextFormat: InsertTextFormat.Snippet,
    })
  }

  const linePrefix = document.getText({
    start: { line: textDocumentPosition.position.line, character: 0 },
    end: textDocumentPosition.position,
  })

  if (linePrefix.endsWith('<')) {
    // Find the unclosed tags
    const text = document.getText()
    const openTags = extractUnmatchedTags(text)

    // If there are unclosed tags, suggest the latest unclosed tag as a closing tag
    let closingTagCompletion: CompletionItem | null = null
    if (openTags.length > 0) {
      const lastTag = openTags[openTags.length - 1].tag
      closingTagCompletion = {
        label: `</${lastTag}>`,
        kind: CompletionItemKind.Snippet,
        insertText: `/${lastTag}>`,
        documentation: {
          kind: 'markdown',
          value: `Closes the <${lastTag}> tag.`,
        },
        detail: `closing </${lastTag}> tag`,
        data: 6,
      }
    }

    // Return both opening tags and the relevant closing tag (if any)
    return closingTagCompletion ? completionItems.concat(closingTagCompletion) : completionItems
  }
  return []
}
