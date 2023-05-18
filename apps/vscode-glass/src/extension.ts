import { parseGlassMetadata, transpileGlass } from '@glass-lang/glassc'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { LeftPanelWebview } from './LeftWebviewProvider'
import { handleStreamResponse } from './api'
import { executeGlassFile } from './executeGlassFile'
import { getDocumentFilename, isGlassFile } from './util/isGlassFile'

let client: LanguageClient | null = null

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
      documentSelector: [{ scheme: 'file', language: 'glass' }],
      outputChannelName: 'Glass Language Server',
    }
  )
  await client.start()

  // Register rig view

  const leftPanelWebViewProvider = new LeftPanelWebview(context?.extensionUri, {})
  const view = vscode.window.registerWebviewViewProvider('left-panel-webview', leftPanelWebViewProvider)
  context.subscriptions.push(view)

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && isGlassFile(editor.document)) {
        const filename = getDocumentFilename(editor.document)
        console.log('opened filename: ' + filename)
        if (leftPanelWebViewProvider._view.webview) {
          console.log('sending to webview')
          leftPanelWebViewProvider._view.webview.postMessage({
            action: 'setActiveFile',
            data: {
              filename,
            },
          })
        }
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (!isGlassFile(event.document)) {
        return
      }
      const activeEditor = vscode.window.activeTextEditor

      if (!activeEditor || activeEditor.document !== event.document) {
        return
      }

      if (leftPanelWebViewProvider._view.webview) {
        const text = event.document.getText()
        const metadata = parseGlassMetadata(text)
        const filename = getDocumentFilename(event.document)
        leftPanelWebViewProvider._view.webview.postMessage({
          action: 'onUpdateGlassFile',
          data: {
            filename,
          },
        })

        leftPanelWebViewProvider._view.webview.postMessage({
          action: 'updateDocumentMetadata',
          data: {
            ...metadata,
            filename,
          },
        })
      } else {
        console.log('webview not ready')
      }
    })
  )

  let activeEditor = vscode.window.activeTextEditor

  const codeDecorations = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('glass.code.background'),
    isWholeLine: true,
  })

  if (activeEditor) {
    updateDecorations()
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(
      editor => {
        activeEditor = editor
        if (editor) {
          updateDecorations()
        }
      },
      null,
      context.subscriptions
    ),
    vscode.workspace.onDidChangeTextDocument(
      editor => {
        if (activeEditor && editor.document === activeEditor.document) {
          updateDecorations()
        }
      },
      null,
      context.subscriptions
    )
    // vscode.workspace.onDidCloseTextDocument(document => diagnosticCollection.delete(document.uri))
  )

  function updateDecorations() {
    if (!activeEditor) {
      console.log('no active editor')
      return
    }

    const regEx = /<(Code)>([\s\S]*?)<\/\1>/g
    const text = activeEditor.document.getText()
    const highlights = []

    let match = null

    while ((match = regEx.exec(text))) {
      const startPos = activeEditor.document.positionAt(match.index)
      const endPos = activeEditor.document.positionAt(match.index + match[0].length)

      // Update the start position to the next line after the opening tag
      const openingTagLine = startPos.line
      const contentStartLine = openingTagLine + 1
      const contentStartPosition = new vscode.Position(contentStartLine, 0)

      // Update the end position to the previous line before the closing tag
      const closingTagLine = endPos.line
      const contentEndLine = closingTagLine - 1
      const contentEndPosition = new vscode.Position(contentEndLine, Number.MAX_SAFE_INTEGER)

      // Create a range for the content between the opening and closing tags
      const range = new vscode.Range(contentStartPosition, contentEndPosition)
      highlights.push(range)
    }

    activeEditor.setDecorations(codeDecorations, highlights)
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('glass.run', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || activeEditor.document.languageId !== 'glass') {
        return
      }

      // Add Assistant tags to the end of the document
      await activeEditor.edit(editBuilder => {
        const lastLine = activeEditor.document.lineCount
        editBuilder.insert(new vscode.Position(lastLine, 0), '\n\n<Assistant>\n\n</Assistant>')
      })

      const config = vscode.workspace.getConfiguration('glass')
      const openaiKey = config.get('openaiKey') as string

      const messages = await executeGlassFile(activeEditor.document, {})
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-3.5-turbo',
          stream: true,
        }),
      })

      await handleStreamResponse(r, (currResult: string, eventData: { choices: { delta: { content: string } }[] }) => {
        if (eventData.choices[0].delta.content) {
          const newResult = currResult + eventData.choices[0].delta.content

          const lines = activeEditor.document.getText().split('\n')
          // Find the last position of "<Assistant>"
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i]
            if (line.includes('<Assistant>')) {
              const assistantLineIndex = i + 1
              const assistantLine = lines[assistantLineIndex]
              // Insert the new data into the document
              void activeEditor.edit(editBuilder => {
                // replace the entire assistantLine with the newResult string
                editBuilder.replace(
                  new vscode.Range(
                    new vscode.Position(assistantLineIndex, 0),
                    new vscode.Position(assistantLineIndex, assistantLine.length)
                  ),
                  newResult
                )
              })
              break
            }
          }

          return newResult
        }
        return currResult
      })

      // Add User tags to the end of the document
      await activeEditor.edit(editBuilder => {
        const lastLine = activeEditor.document.lineCount
        editBuilder.insert(new vscode.Position(lastLine, 0), '\n\n<User>\n\n</User>')
      })

      // Move the cursor to between the User tags
      const lastLine = activeEditor.document.lineCount
      activeEditor.selection = new vscode.Selection(
        new vscode.Position(lastLine - 2, 0),
        new vscode.Position(lastLine - 2, 0)
      )
    }),
    vscode.commands.registerCommand('glass.runPlayground', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && activeEditor.document.languageId === 'glass') {
        const filename = getDocumentFilename(activeEditor.document)
        leftPanelWebViewProvider._view.webview.postMessage({
          action: 'onRunPlayground',
          data: {
            filename,
          },
        })
      } else {
        console.log('webview not ready')
      }
    }),
    vscode.commands.registerCommand('glass.openSettings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'Glass')
    }),
    vscode.commands.registerCommand('glass.openDocs', async () => {
      await vscode.env.openExternal(vscode.Uri.parse('https://docs.glass'))
      await vscode.commands.executeCommand('workbench.action.openSettings', 'Glass')
    }),
    vscode.commands.registerCommand('glass.transpileAll', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (workspaceFolders) {
        for (const workspaceFolder of workspaceFolders) {
          const outputDirectory: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any
          const folderPath = workspaceFolder.uri.fsPath
          /* eslint no-template-curly-in-string: "off" */
          const outDir = outputDirectory.replace('${workspaceFolder}', folderPath)

          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir)
          }

          console.log('about to transpile')
          try {
            const output = transpileGlass(folderPath, folderPath, 'typescript', outDir)

            console.log({ output })

            fs.writeFileSync(path.join(outDir, 'glass.ts'), output)
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
        const document = editor.document
        const filePath = document.uri.fsPath
        try {
          const file = filePath.split('/').slice(-1)[0]
          const code = transpileGlass(path.dirname(filePath), filePath, 'typescript', path.join(path.dirname(filePath)))

          // Fs.writeFileSync(path.join(outputDirectory, 'glassPrompts.ts'), code)
          // const code = processFile(filePath)
          await vscode.env.clipboard.writeText(code)
          await vscode.window.showInformationMessage(`Transpiled ${file} to clipboard.`)
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
