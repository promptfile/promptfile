import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  DocumentFormattingParams,
  InitializeParams,
  InitializeResult,
  InsertTextFormat,
  ProposedFeatures,
  Range,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node'

import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import {
  findEmptyBlocks,
  findInvalidLines,
  findInvalidPromptBlocks,
  findMisalignedTags,
  findMultiplePromptBlocks,
  findUnmatchedTags,
  findUnsupportedTags,
} from './diagnostics'
import { findFoldableTagPairs } from './folding'
import { formatDocument } from './formatting'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
  hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  )

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['<'],
      },
      foldingRangeProvider: true,
      documentFormattingProvider: true,
    },
  }
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    }
  }
  return result
})

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    void connection.client.register(DidChangeConfigurationNotification.type, undefined)
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.')
    })
  }
})

// The example settings
interface ExampleSettings {
  maxNumberOfProblems: number
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 }
let globalSettings: ExampleSettings = defaultSettings

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map()

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear()
  } else {
    globalSettings = <ExampleSettings>(change.settings.languageServerExample || defaultSettings)
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument)
})

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings)
  }
  let result = documentSettings.get(resource)
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'glass',
    })
    documentSettings.set(resource, result)
  }
  return result
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  void validateTextDocument(change.document)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  // Running validateTextDocumentconnection.console.log('Running validateTextDocument')
  // const settings = await getDocumentSettings(textDocument.uri)

  const text = textDocument.getText()
  const diagnostics: Diagnostic[] = []

  const unmatchedTags = findUnmatchedTags(text)
  diagnostics.push(
    ...unmatchedTags.map(({ tag, start }) => {
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
  )

  const unsupportedTags = findUnsupportedTags(text)
  diagnostics.push(
    ...unsupportedTags.map(({ tag, start }) => {
      const range = {
        start: textDocument.positionAt(start + 1),
        end: textDocument.positionAt(start + tag.length + 1),
      }

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range,
        message: `Unsupported tag: ${tag}`,
        source: 'glass',
      }

      return diagnostic
    })
  )

  // const invalidAttributes = findInvalidAttributes(text)
  // diagnostics.push(
  //   ...invalidAttributes.map(({ tag, attribute, start }) => {
  //     const range = {
  //       start: textDocument.positionAt(start),
  //       end: textDocument.positionAt(start + attribute.length),
  //     }

  //     const diagnostic: Diagnostic = {
  //       severity: DiagnosticSeverity.Error,
  //       range,
  //       message: `Invalid attribute "${attribute}" for <${tag}> tag.`,
  //       source: 'glass',
  //     }

  //     return diagnostic
  //   })
  // )

  const misalignedTags = findMisalignedTags(text)
  diagnostics.push(
    ...misalignedTags.map(({ start, end }) => {
      const range = {
        start: textDocument.positionAt(start),
        end: textDocument.positionAt(end),
      }

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range,
        message: `Tags must be on their own lines.`,
        source: 'glass',
      }

      return diagnostic
    })
  )

  const invalidLines = findInvalidLines(text)
  diagnostics.push(
    ...invalidLines.map(({ line, start, end }) => {
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
  )

  const multiplePromptBlocks = findMultiplePromptBlocks(text)
  diagnostics.push(
    ...multiplePromptBlocks.map(({ start, end }) => {
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
  )

  const invalidPromptBlocks = findInvalidPromptBlocks(text)
  diagnostics.push(
    ...invalidPromptBlocks.map(({ start, end }) => {
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
  )

  const emptyBlocks = findEmptyBlocks(text)
  diagnostics.push(
    ...emptyBlocks.map(({ tag, start, end }) => {
      const range = {
        start: textDocument.positionAt(start),
        end: textDocument.positionAt(end),
      }

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range,
        message: `Empty <${tag}> block.`,
        source: 'glass',
      }

      return diagnostic
    })
  )

  // Send the computed diagnostics to VSCode.
  connection.console.log('Sending diagnostics: ' + diagnostics)
  void connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onDidChangeWatchedFiles(_change => {
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event')
})

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
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
      label: '<for>',
      kind: CompletionItemKind.Snippet,
      insertText: 'for each={$1} fragment={item => <Block role={item.role} content={item.content} />} />',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: 'markdown',
        value: 'Creates a for loop',
      },
      detail: 'loop over elements in an array',
      data: 5,
    },
  ]
  const document = documents.get(textDocumentPosition.textDocument.uri)
  if (!document) {
    return []
  }

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
    Block: [
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
    const openingTagRegex = /<(User)(\s+[^>]*)?$/i

    // Check if the user is typing inside a <User>
    const openingTagMatch = text.slice(0, positionOffset).match(openingTagRegex)

    if (openingTagMatch) {
      // Return attribute completions
      return attributeNameCompletion
    }
  }
  return []
})

connection.onFoldingRanges(params => {
  const textDocument = documents.get(params.textDocument.uri)
  if (!textDocument) {
    return null
  }

  const text = textDocument.getText()
  const tagPairs = findFoldableTagPairs(text)

  return tagPairs.map(tagPair => ({
    startLine: textDocument.positionAt(tagPair.start).line,
    endLine: textDocument.positionAt(tagPair.closingStart).line,
  }))
})

connection.onDocumentFormatting(async (params: DocumentFormattingParams): Promise<TextEdit[]> => {
  const { textDocument } = params
  const document = documents.get(textDocument.uri)

  if (!document) {
    return []
  }

  // Call your custom formatting function here
  const formattedText = formatDocument(document.getText())

  // Compute the range of the entire document
  const start = document.positionAt(0)
  const end = document.positionAt(document.getText().length)
  const range = Range.create(start, end)

  // Create a TextEdit with the formatted text
  const textEdit: TextEdit = {
    range,
    newText: formattedText,
  }

  return [textEdit]
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
