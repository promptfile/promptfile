import {
  parseGlassMetadata,
  parseGlassMetadataPython,
  transpileGlassNext,
  transpileGlassPython,
} from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseGlassBlocksRecursive,
  parseGlassTranscriptBlocks,
} from '@glass-lang/glasslib'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { executeTestSuite } from './executeTestSuite'
import { updateDecorations } from './util/decorations'
import { getDocumentFilename, hasGlassFileOpen, isGlassFile } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'
import { updateLanguageMode } from './util/languageMode'
import { GlassSession, createSession, isCurrentSession, resetCurrentSession } from './util/session'
import { updateTokenCount } from './util/tokenCounter'
import { transpileCurrentFile } from './util/transpile'
import { getHtmlForWebview } from './webview'

let client: LanguageClient | null = null

const sessions = new Map<string, GlassSession>()

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // The server is implemented in node
  const languageServerModule = context.asAbsolutePath('out/language-server.js')

  client = new LanguageClient(
    'Glass',
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
      documentSelector: [
        { scheme: 'file', language: '`glass-py`' },
        { scheme: 'file', language: 'glass-ts' },
        { scheme: 'file', language: 'glass-js' },
      ],
      outputChannelName: 'Glass Language Server',
    }
  )
  await client.start()

  let activeEditor = vscode.window.activeTextEditor

  const codeDecorations: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('glass.code.background'),
    isWholeLine: true,
  })

  if (activeEditor) {
    updateDecorations(activeEditor, codeDecorations)
  }

  const tokenCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000000)
  tokenCount.command = undefined
  tokenCount.show()

  const outputChannel = vscode.window.createOutputChannel('Glass')

  context.subscriptions.push(
    tokenCount,
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
        if (editor && isGlassFile(editor.document)) {
          updateTokenCount(tokenCount)
          updateDecorations(editor, codeDecorations)
          await updateLanguageMode(editor.document)
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
          updateDecorations(activeEditor, codeDecorations)
          updateTokenCount(tokenCount)
          await updateLanguageMode(editor.document)
          const existingSession = sessions.get(editor.document.uri.fsPath)
          if (existingSession) {
            await existingSession.playground.webview.postMessage({
              action: 'onDidChangeTextDocument',
              data: {
                currentSource: editor.document.getText(),
              },
            })
          }
        }
      },
      null,
      context.subscriptions
    ),
    vscode.commands.registerCommand('glass.runTestSuite', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        return
      }

      try {
        const elements = parseGlassBlocksRecursive(activeEditor.document.getText())
        const chatElement = elements.find(element => element.tag === 'Request')
        const model =
          chatElement?.attrs?.find((attr: any) => attr.name === 'model')?.stringValue ??
          (vscode.workspace.getConfiguration('glass').get('defaultModel') as string)
        const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
        if (!languageModel) {
          await vscode.window.showErrorMessage(`Unable to find model ${model}`)
          return
        }
        switch (languageModel.creator) {
          case LanguageModelCreator.anthropic:
            const anthropicKey = getAnthropicKey()
            if (anthropicKey == null || anthropicKey === '') {
              await vscode.commands.executeCommand('workbench.action.openSettings', 'glass.anthropicKey')
              await vscode.window.showErrorMessage('Add Anthropic API key to run Glass files.')
              return
            }
            break
          case LanguageModelCreator.openai:
            const openaiKey = getOpenaiKey()
            if (openaiKey == null || openaiKey === '') {
              await vscode.commands.executeCommand('workbench.action.openSettings', 'glass.openaiKey')
              await vscode.window.showErrorMessage('Add OpenAI API key to run Glass files.')
              return
            }
            break
        }
      } catch (e) {
        console.error(e)
      }

      const resp = await executeTestSuite(
        outputChannel,
        activeEditor.document,
        {},
        activeEditor.document.languageId === 'glass-py'
      )
    }),
    vscode.commands.registerCommand('glass.showGlassOutput', async () => {
      outputChannel.show()
    }),
    vscode.commands.registerCommand('glass.createPlayground', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        return
      }

      const initialGlass = activeEditor.document.getText()
      const languageId = activeEditor.document.languageId
      const filepath = activeEditor.document.uri.fsPath
      const filename = getDocumentFilename(activeEditor.document)

      outputChannel.appendLine(`${filename} — launching Glass playground`)

      const initialMetadata =
        languageId === 'glass-py' ? await parseGlassMetadataPython(initialGlass) : parseGlassMetadata(initialGlass)

      // Check if there is an existing panel for this file
      const existingSession = sessions.get(activeEditor.document.uri.fsPath)
      if (existingSession) {
        existingSession.playground.reveal(vscode.ViewColumn.Beside, initialMetadata.interpolationVariables.length === 0)
        return
      }

      // If there's no existing panel, create a new one
      const panel = vscode.window.createWebviewPanel(
        'glass.webView',
        `${filename} (playground)`,
        {
          viewColumn: vscode.ViewColumn.Beside,
          preserveFocus: initialMetadata.interpolationVariables.length === 0,
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      )

      const session = await createSession(panel, sessions)
      if (!session) {
        await vscode.window.showErrorMessage('Unable to create session')
        return
      }

      // When the panel is disposed, remove it from the map
      panel.onDidDispose(() => {
        const currentSession = sessions.get(activeEditor.document.uri.fsPath)
        if (currentSession?.id === session.id) {
          sessions.delete(activeEditor.document.uri.fsPath)
        }
      })

      panel.webview.html = getHtmlForWebview(panel.webview, context.extensionUri)
      panel.webview.onDidReceiveMessage(async (message: any) => {
        switch (message.action) {
          case 'stopSession':
            const stopSession = message.data.session
            if (!isCurrentSession(filepath, stopSession, sessions)) {
              return
            }
            const stoppedGlass = message.data.glass.replace('█', '')
            const stoppedBlocks = parseGlassTranscriptBlocks(stoppedGlass)
            const stoppedMetadata =
              languageId === 'glass-py'
                ? await parseGlassMetadataPython(initialGlass)
                : parseGlassMetadata(stoppedGlass)
            await panel.webview.postMessage({
              action: 'onStream',
              data: {
                session: stopSession,
                glass: stoppedGlass,
                blocks: stoppedBlocks,
                variables: stoppedMetadata.interpolationVariables,
              },
            })
            break
          case 'resetSession':
            const newSession = await resetCurrentSession(filepath, sessions)
            if (!newSession) {
              await vscode.window.showErrorMessage('Unable to reset session')
              return
            }
            await panel.webview.postMessage({
              action: 'setGlass',
              data: {
                session: newSession.id,
              },
            })
            break
          case 'openGlass':
            try {
              const newGlassFile = await vscode.workspace.openTextDocument({
                language: languageId,
                content: message.data.glass,
              })
              await vscode.window.showTextDocument(newGlassFile, {
                viewColumn: vscode.ViewColumn.Active,
              })
            } catch {
              await vscode.window.showErrorMessage('Unable to open Glass file')
            }
            break
          case 'openOutput':
            outputChannel.show()
            break
          // case 'getGlass':
          //   const glassSession = message.data.session
          //   const initialBlocks = parseGlassTranscriptBlocks(initialGlass)
          //   const initialMetadata =
          //     languageId === 'glass-py'
          //       ? await parseGlassMetadataPython(initialGlass)
          //       : parseGlassMetadata(initialGlass)
          //   outputChannel.appendLine(`${filename} — created session ${glassSession}`)
          //   // Get the current workspace root where the file is located
          //   const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)
          //   if (!activeEditorWorkspaceFolder) {
          //     await vscode.window.showErrorMessage('No workspace opened')
          //     return
          //   }

          //   // Define the temporary directory path
          //   const tempDir = path.join(activeEditorWorkspaceFolder.uri.fsPath, '.glasslog')

          //   // Create the temporary directory if it doesn't exist
          //   if (!fs.existsSync(tempDir)) {
          //     fs.mkdirSync(tempDir)
          //   }

          //   // Define the new file's path. This places it in the '.glasslog' directory in the workspace root.
          //   const newFilePath = path.join(tempDir, filename.replace('.glass', `.${glassSession}.glass`))
          //   fs.writeFileSync(newFilePath, initialGlass)
          //   sessionFilePaths.set(glassSession, newFilePath)
          //   await panel.webview.postMessage({
          //     action: 'setGlass',
          //     data: {
          //       filename,
          //       currentSource: initialGlass,
          //       originalSource: initialGlass,
          //       glass: initialGlass,
          //       blocks: initialBlocks,
          //       variables: initialMetadata.interpolationVariables,
          //     },
          //   })
          //   break
          // case 'runSession':
          //   async function runGlassExtension(
          //     activeEditor: vscode.TextEditor,
          //     glass: string,
          //     session: string,
          //     inputs: any
          //   ) {
          //     const elements = parseGlassBlocksRecursive(glass)
          //     const requestElement = elements.find(element => element.tag && ['Request', 'Chat'].includes(element.tag))
          //     const model =
          //       requestElement?.attrs?.find((attr: any) => attr.name === 'model')?.stringValue ??
          //       (vscode.workspace.getConfiguration('glass').get('defaultModel') as string)
          //     const languageModel = LANGUAGE_MODELS.find(m => m.name === model)
          //     if (!languageModel) {
          //       await vscode.window.showErrorMessage(`Unable to find model ${model}`)
          //       return
          //     }
          //     switch (languageModel.creator) {
          //       case LanguageModelCreator.anthropic:
          //         const anthropicKey = getAnthropicKey()
          //         if (anthropicKey == null || anthropicKey === '') {
          //           await vscode.commands.executeCommand('workbench.action.openSettings', 'glass.anthropicKey')
          //           await vscode.window.showErrorMessage('Add Anthropic API key to run Glass files.')
          //           return
          //         }
          //         break
          //       case LanguageModelCreator.openai:
          //         const openaiKey = getOpenaiKey()
          //         if (openaiKey == null || openaiKey === '') {
          //           await vscode.commands.executeCommand('workbench.action.openSettings', 'glass.openaiKey')
          //           await vscode.window.showErrorMessage('Add OpenAI API key to run Glass files.')
          //           return
          //         }
          //         break
          //     }

          //     // Ensure a workspace is opened
          //     if (!vscode.workspace.workspaceFolders) {
          //       await vscode.window.showErrorMessage('No workspace opened')
          //       return
          //     }

          //     const sessionFilePath = sessionFilePaths.get(session)
          //     if (!sessionFilePath) {
          //       await vscode.window.showErrorMessage('No session file path found')
          //       return
          //     }

          //     const sessionDocument = await vscode.workspace.openTextDocument(sessionFilePath)

          //     try {
          //       const resp = await executeGlassFile(outputChannel, sessionDocument, inputs, async ({ nextDoc }) => {
          //         const existingPanel = activePlaygrounds.get(activeEditor.document.uri.fsPath)
          //         if (!existingPanel || stoppedSessions.has(session)) {
          //           return false
          //         }
          //         const blocksForGlass = parseGlassTranscriptBlocks(nextDoc)
          //         const metadataForGlass =
          //           languageId === 'glass-py'
          //             ? await parseGlassMetadataPython(initialGlass)
          //             : parseGlassMetadata(nextDoc)
          //         await panel.webview.postMessage({
          //           action: 'onStream',
          //           data: {
          //             session,
          //             glass: nextDoc,
          //             blocks: blocksForGlass,
          //             variables: metadataForGlass.interpolationVariables,
          //           },
          //         })
          //         return true
          //       })

          //       const existingPanel = activePlaygrounds.get(activeEditor.document.uri.fsPath)
          //       if (!existingPanel || stoppedSessions.has(session)) {
          //         return false
          //       }
          //       const blocksForGlass = parseGlassTranscriptBlocks(resp.finalDoc)
          //       const metadataForGlass =
          //         languageId === 'glass-py'
          //           ? await parseGlassMetadataPython(initialGlass)
          //           : parseGlassMetadata(resp.finalDoc)
          //       await panel.webview.postMessage({
          //         action: 'onResponse',
          //         data: {
          //           session,
          //           glass: resp.finalDoc,
          //           blocks: blocksForGlass,
          //           variables: metadataForGlass.interpolationVariables,
          //           model,
          //           inputs,
          //           output: resp.rawResponse,
          //         },
          //       })
          //       if (resp.continued) {
          //         await runGlassExtension(activeEditor, resp.finalDoc, session, inputs)
          //       }
          //     } catch (error) {
          //       console.error(error)
          //       void vscode.window.showErrorMessage(`ERROR: ${error}`)
          //     } finally {
          //       fs.unlinkSync(newFilePath)
          //     }
          //   }
          //   const session = message.data.session
          //   if (session == null) {
          //     await vscode.window.showErrorMessage('No session provided')
          //     return
          //   }
          //   stoppedSessions.delete(session)
          //   const inputs = message.data.inputs
          //   if (inputs == null) {
          //     await vscode.window.showErrorMessage('No inputs provided')
          //     return
          //   }
          //   const glass = message.data.glass
          //   if (glass == null) {
          //     await vscode.window.showErrorMessage('No glass provided')
          //     return
          //   }
          //   await runGlassExtension(activeEditor, glass, session, inputs)
          //   break
          case 'showMessage':
            const level = message.data.level
            const text = message.data.text
            if (level === 'error') {
              await vscode.window.showErrorMessage(text)
            } else if (level === 'warn') {
              await vscode.window.showWarningMessage(text)
            } else {
              await vscode.window.showInformationMessage(text)
            }
            break
          default:
            break
        }
      })
    }),
    vscode.commands.registerCommand('glass.openSettings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'Glass')
    }),
    vscode.commands.registerCommand('glass.openDocs', async () => {
      await vscode.env.openExternal(vscode.Uri.parse('https://docs.glass'))
    }),
    vscode.commands.registerCommand('glass.transpileAll', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (workspaceFolders) {
        for (const workspaceFolder of workspaceFolders) {
          const outputDirectory: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any
          const languageMode: string = vscode.workspace.getConfiguration('glass').get('defaultLanguageMode') as any
          const folderPath = workspaceFolder.uri.fsPath
          /* eslint no-template-curly-in-string: "off" */
          const outDir = outputDirectory.replace('${workspaceFolder}', folderPath)

          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir)
          }

          try {
            let output = ''
            if (languageMode === 'python') {
              output = await transpileGlassPython(folderPath, folderPath, languageMode, outDir)
            } else {
              output = transpileGlassNext(folderPath, folderPath, languageMode, outDir)
            }

            const extension = languageMode === 'python' ? 'py' : languageMode === 'javascript' ? 'js' : 'ts'

            fs.writeFileSync(path.join(outDir, `glass.${extension}`), output)
          } catch (error) {
            console.error(error)
          }
        }
      }

      await vscode.window.showInformationMessage(`Transpiled all glass files!`)
    }),
    vscode.commands.registerCommand('glass.transpileCurrentFile', async () => {
      const editor = vscode.window.activeTextEditor

      if (editor) {
        try {
          const code = await transpileCurrentFile(editor.document)
          await vscode.env.clipboard.writeText(code)
          await vscode.window.showInformationMessage(`Transpiled to clipboard.`)
        } catch (error) {
          console.error(error)
          throw error
        }
      }
    })
  )
}

// This method is called when your extension is deactivated
export async function deactivate() {
  if (client) {
    return await client.stop()
  }
}
