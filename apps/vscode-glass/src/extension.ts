import { parseGlassMetadata } from '@glass-lang/glasslib'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { GlassPlayground, createPlayground } from './playground/playground'
import { getCurrentViewColumn } from './playground/viewColumn'
import { transpileCode } from './transpileCode'
import { getAllPromptfiles, getDocumentFilename, isPromptfile } from './util/isPromptfile'
import { updateTokenCount } from './util/tokenCounter'

let client: LanguageClient | null = null

const stoppedRequestIds = new Set<string>()
const playgrounds = new Map<string, GlassPlayground>()
const fileTimestamps = new Map<string, number>()

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // The server is implemented in node
  const languageServerModule = context.asAbsolutePath('out/language-server.js')

  // https://gist.github.com/rothfels/19f9bb9c38eee4af786dea515b1f455e
  const recentlySelectedFilesKey = 'recentlySelectedFiles'
  let recentlySelectedFiles: vscode.Uri[] = context.workspaceState.get(recentlySelectedFilesKey, [])

  async function updateRecentlySelectedFiles(selectedUri: vscode.Uri) {
    // Remove any existing instance of the selected file.
    recentlySelectedFiles = recentlySelectedFiles.filter(uri => uri.toString() !== selectedUri.toString())

    // Add the selected file to the beginning of the array.
    recentlySelectedFiles.unshift(selectedUri)

    // Save the updated array.
    await context.workspaceState.update(recentlySelectedFilesKey, recentlySelectedFiles)
  }

  client = new LanguageClient(
    'promptfile',
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the options are used
    {
      run: { module: languageServerModule, transport: TransportKind.ipc },
      debug: {
        module: languageServerModule,
        transport: TransportKind.ipc,
        options: { execArgv: ['--nolazy', '--inspect=6009'] },
      },
    },
    {
      documentSelector: [{ scheme: 'file', language: 'promptfile' }],
      outputChannelName: 'Prompt Language Server',
    }
  )
  await client.start()

  let activeEditor = vscode.window.activeTextEditor

  const tokenCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000000)
  tokenCount.command = undefined
  tokenCount.show()

  async function launchGlassDocument(selectedDocument: vscode.TextDocument) {
    const relativePath = vscode.workspace.asRelativePath(selectedDocument.uri.fsPath)
    fileTimestamps.set(relativePath, Date.now())

    const initialGlass = selectedDocument.getText()
    const filepath = selectedDocument.uri.fsPath
    const filename = getDocumentFilename(selectedDocument)

    const initialMetadata = parseGlassMetadata(initialGlass)
    const playground = await createPlayground(filepath, playgrounds, context.extensionUri, stoppedRequestIds)
    if (!playground) {
      await vscode.window.showErrorMessage('Unable to create playground')
      return
    }
    playground.panel.reveal(getCurrentViewColumn(playgrounds), initialMetadata.interpolationVariables.length === 0)
  }

  context.subscriptions.push(
    tokenCount,
    vscode.workspace.onDidOpenTextDocument(document => {
      if (isPromptfile(document)) {
        const relativePath = vscode.workspace.asRelativePath(document.uri.fsPath)
        fileTimestamps.set(relativePath, Date.now())
      }
    }),
    vscode.window.onDidChangeTextEditorSelection(
      event => {
        if (event.textEditor === vscode.window.activeTextEditor) {
          updateTokenCount(tokenCount)
        }
      },
      null,
      context.subscriptions
    ),
    vscode.window.onDidChangeActiveTextEditor(
      async editor => {
        activeEditor = editor
        if (editor && isPromptfile(editor.document)) {
          updateTokenCount(tokenCount)
          // updateDecorations(editor, codeDecorations)
          const relativePath = vscode.workspace.asRelativePath(editor.document.uri.fsPath)
          fileTimestamps.set(relativePath, Date.now())
        } else {
          tokenCount.hide()
        }
      },
      null,
      context.subscriptions
    ),
    vscode.workspace.onDidChangeTextDocument(
      async editor => {
        if (activeEditor && editor.document === activeEditor.document) {
          // updateDecorations(activeEditor, codeDecorations)
          updateTokenCount(tokenCount)
          const existingPlayground = playgrounds.get(editor.document.uri.fsPath)
          if (existingPlayground) {
            await existingPlayground.panel.webview.postMessage({
              action: 'onDidChangeTextDocument',
              data: {
                currentSource: editor.document.getText(),
              },
            })
          }
          const relativePath = vscode.workspace.asRelativePath(editor.document.uri.fsPath)
          fileTimestamps.set(relativePath, Date.now())
        }
      },
      null,
      context.subscriptions
    ),
    vscode.commands.registerCommand('promptfile.run', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && isPromptfile(activeEditor.document)) {
        await launchGlassDocument(activeEditor.document)
        await updateRecentlySelectedFiles(activeEditor.document.uri)
        return
      }
      const promptFiles = await getAllPromptfiles()
      if (promptFiles.length === 0) {
        await vscode.window.showErrorMessage('Unable to find any `.prompt` files')
        return
      } else if (promptFiles.length === 1) {
        const doc = await vscode.workspace.openTextDocument(promptFiles[0])
        await launchGlassDocument(doc)
        return
      }
      const promptFilesQuickPick = promptFiles.map(documentUri => {
        const relativePath = vscode.workspace.asRelativePath(documentUri.fsPath)
        return {
          label: path.basename(documentUri.fsPath),
          description: relativePath,
          uri: documentUri,
        }
      })
      promptFilesQuickPick.sort((a, b) => {
        const indexA = recentlySelectedFiles.findIndex(uri => uri.fsPath === a.uri.fsPath)
        const indexB = recentlySelectedFiles.findIndex(uri => uri.fsPath === b.uri.fsPath)

        if (indexA === -1 && indexB === -1) {
          return a.label.localeCompare(b.label)
        } else if (indexA === -1) {
          return 1
        } else if (indexB === -1) {
          return -1
        } else {
          return indexA - indexB
        }
      })
      const selectedFile = await vscode.window.showQuickPick(promptFilesQuickPick, {
        placeHolder: 'Select a `.prompt` file to run',
      })
      if (!selectedFile) {
        return
      }
      const selectedDocument = promptFiles.find(documentUri => {
        const relativePath = vscode.workspace.asRelativePath(documentUri.fsPath)
        return relativePath === selectedFile.description
      })
      if (!selectedDocument) {
        await vscode.window.showErrorMessage('Unable to find `.prompt` file')
        return
      }
      await updateRecentlySelectedFiles(selectedDocument)
      const doc = await vscode.workspace.openTextDocument(selectedDocument)
      await launchGlassDocument(doc)
    }),
    vscode.commands.registerCommand('promptfile.settings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'promptfile')
    }),
    vscode.commands.registerCommand('promptfile.transpile', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && isPromptfile(activeEditor.document)) {
        const text = activeEditor.document.getText()
        await transpileCode(text)
        return
      }
      const promptFiles = await getAllPromptfiles()
      if (promptFiles.length === 0) {
        await vscode.window.showErrorMessage('Unable to find any `.prompt` files')
        return
      } else if (promptFiles.length === 1) {
        const doc = await vscode.workspace.openTextDocument(promptFiles[0])
        await launchGlassDocument(doc)
        return
      }
      const promptFilesQuickPick = promptFiles.map(documentUri => {
        const relativePath = vscode.workspace.asRelativePath(documentUri.fsPath)
        return {
          label: path.basename(documentUri.fsPath),
          description: relativePath,
          uri: documentUri,
        }
      })
      promptFilesQuickPick.sort((a, b) => {
        const indexA = recentlySelectedFiles.findIndex(uri => uri.fsPath === a.uri.fsPath)
        const indexB = recentlySelectedFiles.findIndex(uri => uri.fsPath === b.uri.fsPath)
        if (indexA === -1 && indexB === -1) {
          return a.label.localeCompare(b.label)
        } else if (indexA === -1) {
          return 1
        } else if (indexB === -1) {
          return -1
        } else {
          return indexA - indexB
        }
      })
      const selectedFile = await vscode.window.showQuickPick(promptFilesQuickPick, {
        placeHolder: 'Select a `.prompt` file to transpile',
      })
      if (!selectedFile) {
        return
      }
      const selectedDocument = promptFiles.find(documentUri => {
        const relativePath = vscode.workspace.asRelativePath(documentUri.fsPath)
        return relativePath === selectedFile.description
      })
      if (!selectedDocument) {
        await vscode.window.showErrorMessage('Unable to find `.prompt` file')
        return
      }
      await updateRecentlySelectedFiles(selectedDocument)
      const doc = await vscode.workspace.openTextDocument(selectedDocument)
      await transpileCode(doc.getText())
    })
  )
}

// This method is called when your extension is deactivated
export async function deactivate() {
  if (client) {
    return await client.stop()
  }
}
