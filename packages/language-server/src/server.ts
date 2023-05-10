import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node'

import { TextDocument } from 'vscode-languageserver-textdocument'
import { findUnmatchedTags, findUnsupportedTags } from './diagnostics'
import { findFoldableTagPairs } from './folding'

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
  const unmatchedTags = findUnmatchedTags(text)
  const unsupportedTags = findUnsupportedTags(text)
  console.log(unsupportedTags)
  const diagnostics: Diagnostic[] = unmatchedTags.map(({ tag, start }) => {
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
  diagnostics.push(
    ...unsupportedTags.map(({ tag, start }) => {
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
      insertText: 'User>\n$0\n</User>',
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
      insertText: 'Assistant>\n$0\n</Assistant>',
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
      insertText: 'System>\n$0\n</System>',
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
      insertText: 'Prompt>\n$0\n</Prompt>',
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
      insertText: 'Code>\n$0\n</Code>',
      documentation: {
        kind: 'markdown',
        value: 'Creates a Code tag with inner content',
      },
      detail: 'executable typescript code block',
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

  // If the prefix is empty, return all the completion items
  if (!linePrefix.startsWith('<')) {
    return completionItems
  }
  // Otherwise, filter the items based on the prefix
  return completionItems.filter(item => item.label.startsWith(linePrefix))
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

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
