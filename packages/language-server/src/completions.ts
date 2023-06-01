import { CompletionItem, CompletionItemKind, InsertTextFormat, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { extractUnmatchedTags } from './diagnostics/findUnmatchedTags'
import { glassElements } from './elements'

export function generateCompletions(
  document: TextDocument,
  textDocumentPosition: TextDocumentPositionParams
): CompletionItem[] {
  const completionItems: CompletionItem[] = []

  for (const element of glassElements) {
    const requiredAttributes = element.attributes.filter(a => a.optional !== true)
    const attributesToInsert: string[] = requiredAttributes.map((attribute, index) => {
      const cursorIndex = index + 1
      const attributeValue =
        attribute.values && attribute.values.length > 0
          ? `"\${${cursorIndex}|${attribute.values
              .map(value => value.name)
              .sort()
              .join(',')}|}"`
          : attribute.type === 'boolean'
          ? `\${${cursorIndex}|true,false|}`
          : attribute.type === 'string'
          ? `"$${cursorIndex}"`
          : attribute.type === 'array'
          ? `{$${cursorIndex}}`
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
      insertText:
        element.insertText != null
          ? element.insertText
          : element.selfClosing != null
          ? `${element.name}${attributesToInsert.join('')} />`
          : `${element.name}${attributesToInsert.join('')}>\n$0\n</${element.name}>`,
      insertTextFormat: InsertTextFormat.Snippet,
    })
  }

  // Extract the current line's text up to the cursor position
  const linePrefix = document.getText({
    start: { line: textDocumentPosition.position.line, character: 0 },
    end: textDocumentPosition.position,
  })

  // Check if we're inside an attribute value
  const attributeValueMatch = linePrefix.match(/<(\w+).*? (\w+)="([^"]*)$/)

  if (attributeValueMatch) {
    const tagName = attributeValueMatch[1]
    const attributeName = attributeValueMatch[2]
    const attributeValue = attributeValueMatch[3]

    // Look up the element and attribute
    const element = glassElements.find(e => e.name === tagName)
    const attribute = element ? element.attributes.find(a => a.name === attributeName) : undefined

    // If we found an element and attribute with valid values, return those as completions
    if (attribute && attribute.values) {
      const range = {
        // We start the replacement at the last quote or whitespace character, whichever comes last.
        start: {
          line: textDocumentPosition.position.line,
          character: Math.max(linePrefix.lastIndexOf(' '), linePrefix.lastIndexOf('"')) + 1,
        },
        end: textDocumentPosition.position,
      }
      console.log(attribute.values)

      return attribute.values.map(value => ({
        label: value.name,
        kind: CompletionItemKind.EnumMember,
        insertText: value.name,
        insertTextFormat: InsertTextFormat.PlainText,
        detail: value.detail,
        documentation: value.documentation
          ? {
              kind: 'markdown',
              value: value.documentation,
            }
          : undefined,
        range, // Add this line
      }))
    }
  }

  // Check if we're at a position to input an attribute name
  const tagNameMatch = linePrefix.match(/<(\w+)(.*?)$/)
  if (tagNameMatch) {
    const tagName = tagNameMatch[1]
    const tagContent = tagNameMatch[2]

    // Look up the element
    const element = glassElements.find(e => e.name === tagName)

    // Parse existing attributes
    const existingAttributeNames = [...tagContent.matchAll(/(\w+)="[^"]*"/g)].map(match => match[1])

    // If we found an element with attributes, return those as completions
    if (element && element.attributes) {
      // Filter out already existing attributes
      const remainingAttributes = element.attributes.filter(a => !existingAttributeNames.includes(a.name))

      return remainingAttributes.map(attribute => {
        if (attribute.values) {
          return {
            label: attribute.name,
            kind: CompletionItemKind.Property,
            insertText: `${attribute.name}="\${1|${attribute.values
              .map(a => a.name)
              .sort()
              .join(',')}|}"`,
            insertTextFormat: InsertTextFormat.Snippet,
          }
        } else {
          return {
            label: attribute.name,
            kind: CompletionItemKind.Property,
            insertText: `${attribute.name}="$1"`,
            insertTextFormat: InsertTextFormat.Snippet,
          }
        }
      })
    }
  }

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
