import { parseGlassMetadata, transpileGlassTypescript } from '@glass-lang/glassc'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { getAllPromptFiles, getDocumentFilename, isPromptFile } from './util/isPromptFile'
import { GlassPlayground, createPlayground } from './util/playground'
import { updateTokenCount } from './util/tokenCounter'
import { transpileCurrentFile } from './util/transpile'
import { getCurrentViewColumn } from './util/viewColumn'

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
    'Promptfile',
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
      documentSelector: [{ scheme: 'file', language: 'prompt' }],
      outputChannelName: 'Promptfile Language Server',
    }
  )
  await client.start()

  let activeEditor = vscode.window.activeTextEditor

  // const codeDecorations: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
  //   backgroundColor: new vscode.ThemeColor('prompt.code.background'),
  //   isWholeLine: true,
  // })

  // if (activeEditor) {
  //   updateDecorations(activeEditor, codeDecorations)
  // }

  const tokenCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000000)
  tokenCount.command = undefined
  tokenCount.show()

  const outputChannel = vscode.window.createOutputChannel('Promptfile')

  async function launchGlassDocument(selectedDocument: vscode.TextDocument, outputChannel: vscode.OutputChannel) {
    const relativePath = vscode.workspace.asRelativePath(selectedDocument.uri.fsPath)
    fileTimestamps.set(relativePath, Date.now())

    const initialGlass = selectedDocument.getText()
    const filepath = selectedDocument.uri.fsPath
    const filename = getDocumentFilename(selectedDocument)

    outputChannel.appendLine(`${filename} — launching Promptfile playground`)
    const initialMetadata = parseGlassMetadata(initialGlass)
    const playground = await createPlayground(
      filepath,
      playgrounds,
      context.extensionUri,
      outputChannel,
      stoppedRequestIds
    )
    if (!playground) {
      await vscode.window.showErrorMessage('Unable to create playground')
      return
    }
    playground.panel.reveal(getCurrentViewColumn(playgrounds), initialMetadata.interpolationVariables.length === 0)
  }

  context.subscriptions.push(
    tokenCount,
    vscode.workspace.onDidOpenTextDocument(document => {
      if (isPromptFile(document)) {
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
        if (editor && isPromptFile(editor.document)) {
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
    vscode.commands.registerCommand('prompt.showGlassOutput', async () => {
      outputChannel.show()
    }),
    vscode.commands.registerCommand('prompt.run', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && isPromptFile(activeEditor.document)) {
        await launchGlassDocument(activeEditor.document, outputChannel)
        await updateRecentlySelectedFiles(activeEditor.document.uri)
        return
      }
      const glassFiles = await getAllPromptFiles()
      if (glassFiles.length === 0) {
        await vscode.window.showErrorMessage('Unable to find any Promptfile files')
        return
      } else if (glassFiles.length === 1) {
        const doc = await vscode.workspace.openTextDocument(glassFiles[0])
        await launchGlassDocument(doc, outputChannel)
        return
      }
      const glassFilesQuickPick = glassFiles.map(documentUri => {
        const relativePath = vscode.workspace.asRelativePath(documentUri.fsPath)
        return {
          label: path.basename(documentUri.fsPath),
          description: relativePath,
          uri: documentUri,
        }
      })
      glassFilesQuickPick.sort((a, b) => {
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
      const selectedFile = await vscode.window.showQuickPick(glassFilesQuickPick, {
        placeHolder: 'Select a `.prompt` file to run',
      })
      if (!selectedFile) {
        return
      }
      const selectedDocument = glassFiles.find(documentUri => {
        const relativePath = vscode.workspace.asRelativePath(documentUri.fsPath)
        return relativePath === selectedFile.description
      })
      if (!selectedDocument) {
        await vscode.window.showErrorMessage('Unable to find `.prompt` file')
        return
      }
      await updateRecentlySelectedFiles(selectedDocument)
      const doc = await vscode.workspace.openTextDocument(selectedDocument)
      await launchGlassDocument(doc, outputChannel)
    }),
    vscode.commands.registerCommand('prompt.settings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'prompt')
    }),
    vscode.commands.registerCommand('prompt.transpile', async () => {
      const languageMode: string = vscode.workspace.getConfiguration('prompt').get('defaultLanguageMode') as any
      async function transpileAll() {
        const workspaceFolders = vscode.workspace.workspaceFolders
        if (workspaceFolders) {
          for (const workspaceFolder of workspaceFolders) {
            const outputDirectory: string = vscode.workspace.getConfiguration('prompt').get('outputDirectory') as any
            const defaultModel: string = vscode.workspace.getConfiguration('prompt').get('defaultModel') as any

            const folderPath = workspaceFolder.uri.fsPath
            /* eslint no-template-curly-in-string: "off" */
            const outDir = outputDirectory.replace('${workspaceFolder}', folderPath)

            if (!fs.existsSync(outDir)) {
              fs.mkdirSync(outDir)
            }

            try {
              let output = ''
              output = transpileGlassTypescript(folderPath, folderPath, languageMode, outDir, defaultModel)

              const extension = languageMode === 'javascript' ? 'js' : 'ts'
              const outputPath = path.join(outDir, `prompt.${extension}`)
              fs.writeFileSync(outputPath, output)
              const doc = await vscode.workspace.openTextDocument(outputPath)
              await vscode.window.showTextDocument(doc)
            } catch (error) {
              await vscode.window.showErrorMessage(`Unable to transpile files: ${error}`)
            }
          }
        }
      }

      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && isPromptFile(activeEditor.document)) {
        const filename = getDocumentFilename(activeEditor.document)
        const transpilationModes = [
          {
            label: `Transpile current file`,
            description: `Converts current file (${filename}) to ${languageMode}`,
            action: 'current',
          },
          {
            label: `Transpile all files`,
            description: `Converts all Promptfile files in this workspace to ${languageMode}`,
            action: 'all',
          },
        ]
        const transpilationMode = await vscode.window.showQuickPick(transpilationModes, {
          placeHolder: `Transpile to ${languageMode}`,
        })
        if (transpilationMode?.action === 'current') {
          try {
            const code = await transpileCurrentFile(activeEditor.document)
            // open a new buffer with this transpiled code
            const doc = await vscode.workspace.openTextDocument({
              language: languageMode,
              content: code,
            })
            await vscode.window.showTextDocument(doc)
          } catch (error) {
            await vscode.window.showErrorMessage(`Unable to transpile file: ${error}`)
          }
          return
        } else if (transpilationMode?.action === 'all') {
          await transpileAll()
          return
        }
      }

      await transpileAll()
    })
  )
}

// This method is called when your extension is deactivated
export async function deactivate() {
  if (client) {
    return await client.stop()
  }
}
