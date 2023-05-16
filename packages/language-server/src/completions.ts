import { CompletionItem, CompletionItemKind, InsertTextFormat, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { findUnmatchedTags } from './diagnostics'

export function generateCompletions(document: TextDocument, textDocumentPosition: TextDocumentPositionParams) {
  const completionItems: CompletionItem[] = [
    {
      label: '<User>',
      kind: CompletionItemKind.Snippet,
      insertText: 'User>\n$1\n</User>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a User tag with inner content',
      },
      detail: '"user" role block for chat inference',
      data: 1,
    },
    {
      label: '<Assistant>',
      kind: CompletionItemKind.Snippet,
      insertText: 'Assistant>\n$1\n</Assistant>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates an Assistant tag with inner content',
      },
      detail: '"assistant" role block for chat inference',
      data: 2,
    },
    {
      label: '<System>',
      kind: CompletionItemKind.Snippet,
      insertText: 'System>\n$1\n</System>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a System tag with inner content',
      },
      detail: '"system" role block for chat inference',
      data: 3,
    },
    {
      label: '<Prompt>',
      kind: CompletionItemKind.Snippet,
      insertText: 'Prompt>\n$1\n</Prompt>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Prompt tag with inner content',
      },
      detail: 'prompt block for non-chat inference',
      data: 4,
    },
    {
      label: '<Code>',
      kind: CompletionItemKind.Snippet,
      insertText: 'Code>\n$1\n</Code>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Code tag with inner content',
      },
      detail: 'executable typescript code block',
      data: 5,
    },
    {
      label: '<For>',
      kind: CompletionItemKind.Snippet,
      insertText: 'For each={$1} fragment={item => <Block role={item.role} content={item.content} />} />',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a for loop',
      },
      detail: 'loop over elements in an array',
      data: 5,
    },
    {
      label: '<Block>',
      kind: CompletionItemKind.Snippet,
      insertText: 'Block role="$1" content="$2" />',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Block element for chat inference',
      },
      detail: 'block element for chat inference',
      data: 5,
    },
  ]

  const linePrefix = document.getText({
    start: { line: textDocumentPosition.position.line, character: 0 },
    end: textDocumentPosition.position,
  })

  const validAttributes: Record<string, CompletionItem[]> = {
    User: [
      {
        label: 'name',
        kind: CompletionItemKind.Property,
        insertText: 'name=""',
        documentation: {
          kind: 'markdown',
          value: 'The `name` attribute allows you to assign a name to a User block.',
        },
        detail: 'User name attribute',
        data: 7,
      },
    ],
    Assistant: [
      {
        label: 'name',
        kind: CompletionItemKind.Property,
        insertText: 'name=""',
        documentation: {
          kind: 'markdown',
          value: 'The `name` attribute allows you to assign a name to an Assistant block.',
        },
        detail: 'User or Assistant name attribute',
        data: 7,
      },
    ],
    block: [
      {
        label: 'role',
        kind: CompletionItemKind.Property,
        insertText: 'role=""',
        documentation: {
          kind: 'markdown',
          value: 'The `role` attribute allows you to assign a role to a chat block.',
        },
        detail: '"system, user, or assistant',
        data: 7,
      },
      {
        label: 'content',
        kind: CompletionItemKind.Property,
        insertText: 'content=""',
        documentation: {
          kind: 'markdown',
          value: 'The `content` attribute allows you to assign string content to a chat block.',
        },
        detail: 'content of the chat block',
        data: 7,
      },
    ],
    for: [
      {
        label: 'each',
        kind: CompletionItemKind.Property,
        insertText: 'each={}',
        documentation: {
          kind: 'markdown',
          value: 'The `each` attribute defines the array you want to iterate over.',
        },
        detail: 'array to iterate over',
        data: 7,
      },
      {
        label: 'fragment',
        kind: CompletionItemKind.Property,
        insertText: 'fragment={item => <Block role={item.role} content={item.content} />}',
        documentation: {
          kind: 'markdown',
          value: 'The fragment attribute defines a function that returns a block for each element in the array.',
        },
        detail: 'how to construct blocks for this array',
        data: 7,
      },
    ],
  }

  if (linePrefix.endsWith('<')) {
    // Find the unclosed tags
    const text = document.getText()
    const openTags = findUnmatchedTags(text)

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
  } else {
    const text = document.getText()
    const positionOffset = document.offsetAt(textDocumentPosition.position)
    const openingTagRegex = /<(User|Assistant|System|Prompt|Block|for|Code)(\s+[^>]*)?$/i

    // Check if the user is typing inside a <User>
    const openingTagMatch = text.slice(0, positionOffset).match(openingTagRegex)

    if (openingTagMatch) {
      const matchedTag = openingTagMatch[1]
      return validAttributes[matchedTag] || []
    }
  }
  return []
}
