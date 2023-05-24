import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import {
  CompletionItem,
  Diagnostic,
  DidChangeConfigurationNotification,
  DocumentFormattingParams,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  Range,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node'
import { generateCompletions } from './completions'
import { findAnthropicDiagnostics } from './diagnostics/findAnthropicDiagnostics'
import { findEmptyBlocks } from './diagnostics/findEmptyBlocks'
import { findFrontmatterDiagnostics } from './diagnostics/findFrontmatterDiagnostics'
import { findInvalidAttributes } from './diagnostics/findInvalidAttributes'
import { findInvalidPromptBlocks } from './diagnostics/findInvalidPromptBlocks'
import { findMultiplePromptBlocks } from './diagnostics/findMultiplePromptBlocks'
import { findUnmatchedTags } from './diagnostics/findUnmatchedTags'
import { findUnsupportedTags } from './diagnostics/findUnsupportedTags'
import { findFoldableTagPairs, findMarkdownFoldingRanges } from './folding'
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

connection.onDidChangeConfiguration(change => {
  documents.all().forEach(validateTextDocument)
})

documents.onDidChangeContent(change => {
  void validateTextDocument(change.document)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const diagnostics: Diagnostic[] = [
    ...findUnmatchedTags(textDocument),
    ...findUnsupportedTags(textDocument),
    ...findInvalidAttributes(textDocument),
    ...findMultiplePromptBlocks(textDocument),
    ...findInvalidPromptBlocks(textDocument),
    ...findEmptyBlocks(textDocument),
    ...findAnthropicDiagnostics(textDocument),
    ...findFrontmatterDiagnostics(textDocument),
  ]

  void connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onDidChangeWatchedFiles(_change => {
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event')
})

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const document = documents.get(textDocumentPosition.textDocument.uri)
  if (!document) {
    return []
  }

  return generateCompletions(document, textDocumentPosition)
})

connection.onFoldingRanges(params => {
  const textDocument = documents.get(params.textDocument.uri)
  if (!textDocument) {
    return null
  }

  const text = textDocument.getText()
  const foldableTagPairs = findFoldableTagPairs(text)
  const foldingRanges = findMarkdownFoldingRanges(text)

  return [...foldableTagPairs, ...foldingRanges].map(pair => {
    return {
      startLine: textDocument.positionAt(pair.start).line,
      endLine: textDocument.positionAt(pair.end).line,
      startCharacter: textDocument.positionAt(pair.start).character,
      endCharacter: textDocument.positionAt(pair.end).character,
      kind: pair.tag === 'markdown' ? 'comment' : 'region',
    }
  })
})

connection.onDocumentFormatting(async (params: DocumentFormattingParams): Promise<TextEdit[]> => {
  const { textDocument } = params
  const document = documents.get(textDocument.uri)

  if (!document) {
    return []
  }

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

documents.listen(connection)

connection.listen()
