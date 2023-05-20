import { CompletionItem, CompletionItemKind, InsertTextFormat, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { extractUnmatchedTags } from './diagnostics/findUnmatchedTags'

interface ValidAttribute {
  completionItem: CompletionItem
  values?: CompletionItem[]
}

export function generateCompletions(document: TextDocument, textDocumentPosition: TextDocumentPositionParams) {
  const completionItems: CompletionItem[] = [
    {
      label: 'User',
      kind: CompletionItemKind.Snippet,
      insertText: 'User>\n$1\n</User>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a User tag with inner content',
      },
      detail: '(block) chat block with role="user"',
      data: 1,
    },
    {
      label: 'Assistant',
      kind: CompletionItemKind.Snippet,
      insertText: 'Assistant>\n$1\n</Assistant>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates an Assistant tag with inner content',
      },
      detail: '(block) chat block with role="assistant"',
      data: 2,
    },
    {
      label: 'System',
      kind: CompletionItemKind.Snippet,
      insertText: 'System>\n$1\n</System>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a System tag with inner content',
      },
      detail: '(block) chat block with role="system"',
      data: 3,
    },
    {
      label: 'Code',
      kind: CompletionItemKind.Snippet,
      insertText: 'Code>\n$1\n</Code>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Code tag with inner content',
      },
      detail: '(executable) executable code block',
      data: 5,
    },
    {
      label: 'Text',
      kind: CompletionItemKind.Snippet,
      insertText: 'Text>\n$1\n</Text>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Text tag with inner content',
      },
      detail: '(element) raw Glass text block',
      data: 5,
    },
    {
      label: 'For',
      kind: CompletionItemKind.Snippet,
      insertText: 'For each={$1} fragment={item => <Block role={item.role} content={item.content} />} />',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a for loop',
      },
      detail: '(element) loop over elements in an array',
      data: 5,
    },
    {
      label: 'Chat',
      kind: CompletionItemKind.Snippet,
      insertText: 'Chat model="$1">\n$2\n</Chat>',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Chat model inference',
      },
      detail: '(inference) API request to a Chat model',
      data: 5,
    },
    {
      label: 'Completion',
      kind: CompletionItemKind.Snippet,
      insertText: 'Completion model="$1" />',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Completion model inference',
      },
      detail: '(inference) API request to a Completion model',
      data: 5,
    },
    {
      label: 'Block',
      kind: CompletionItemKind.Snippet,
      insertText: 'Block role="$1" content="$2" />',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a Block element for chat inference',
      },
      detail: 'block element for chat inference',
      data: 6,
    },
  ]

  const linePrefix = document.getText({
    start: { line: textDocumentPosition.position.line, character: 0 },
    end: textDocumentPosition.position,
  })

  const validAttributes: Record<string, ValidAttribute[]> = {
    Chat: [
      {
        completionItem: {
          label: 'model',
          kind: CompletionItemKind.Property,
          insertText: 'model=""',
          documentation: {
            kind: 'markdown',
            value: 'The `model` attribute determines which chat model to inference',
          },
          detail: 'chat model for inference',
          data: 7,
        },
        values: [
          {
            label: 'gpt-3.5-turbo',
            kind: CompletionItemKind.Value,
            detail: 'OpenAI',
            data: 8,
          },
          {
            label: 'gpt-4',
            kind: CompletionItemKind.Value,
            detail: 'OpenAI',
            data: 9,
          },
        ],
      },
      {
        completionItem: {
          label: 'temperature',
          kind: CompletionItemKind.Property,
          insertText: 'temperature={0.7}',
          documentation: {
            kind: 'markdown',
            value: 'The `temperature` attribute allows you to set the temperature for the model inference.',
          },
          detail: 'Set model temperature',
          data: 7,
        },
      },
      {
        completionItem: {
          label: 'maxTokens',
          kind: CompletionItemKind.Property,
          insertText: 'maxTokens={256}',
          documentation: {
            kind: 'markdown',
            value: 'The `maxTokens` attribute allows you to set the maximum tokens for the model inference.',
          },
          detail: 'Set maximum tokens',
          data: 7,
        },
      },
    ],
    Completion: [
      {
        completionItem: {
          label: 'model',
          kind: CompletionItemKind.Property,
          insertText: 'model=""',
          documentation: {
            kind: 'markdown',
            value: 'The `model` attribute determines which completion model to inference',
          },
          detail: 'chat model for inference',
          data: 7,
        },
      },
    ],
    User: [
      {
        completionItem: {
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
      },
    ],
    Assistant: [
      {
        completionItem: {
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
      },
    ],
    Block: [
      {
        completionItem: {
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
        values: [
          {
            label: 'assistant',
            kind: CompletionItemKind.Value,
            detail: 'assistant',
            data: 8,
          },
          {
            label: 'user',
            kind: CompletionItemKind.Value,
            detail: 'user',
            data: 9,
          },
          {
            label: 'system',
            kind: CompletionItemKind.Value,
            detail: 'system',
            data: 9,
          },
        ],
      },
      {
        completionItem: {
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
      },
    ],
    For: [
      {
        completionItem: {
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
      },
      {
        completionItem: {
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
      },
    ],
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
  } else {
    const text = document.getText()
    const positionOffset = document.offsetAt(textDocumentPosition.position)
    const openingTagRegex = /<(User|Assistant|System|Prompt|Block|For|Code|Chat|Completion)(\s+[^>]*)?$/i

    // Check if the user is typing inside a <User>
    const openingTagMatch = text.slice(0, positionOffset).match(openingTagRegex)

    const attributeRegex = /\b(model)="([^"]*)$/i
    const attributeMatch = text.slice(0, positionOffset).match(attributeRegex)

    if (attributeMatch) {
      const attributeName = attributeMatch[1]
      const attributeValuePrefix = attributeMatch[2]

      if (openingTagMatch) {
        const matchedTag = openingTagMatch[1]
        const attribute = validAttributes[matchedTag]?.find(a => a.completionItem.label === attributeName)

        if (attribute && attribute.values) {
          // Filter the attribute values based on the prefix typed by the user
          return attribute.values.filter(v => v.label.startsWith(attributeValuePrefix))
        }
      }
    }

    // Continue with the current logic if the user is not typing inside an attribute
    if (openingTagMatch) {
      const matchedTag = openingTagMatch[1]
      return validAttributes[matchedTag]?.map(attr => attr.completionItem) || []
    }
  }
  return []
}
