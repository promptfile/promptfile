import { transpileGlass, transpileGlassNext } from '@glass-lang/glassc'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { executeGlassFile } from './executeGlassFile'
import { updateDecorations } from './util/decorations'
import { getDocumentFilename } from './util/isGlassFile'
import { getHtmlForWebview } from './webview'

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

  let activeEditor = vscode.window.activeTextEditor

  const codeDecorations: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('glass.code.background'),
    isWholeLine: true,
  })

  if (activeEditor) {
    updateDecorations(activeEditor, codeDecorations)
  }

  // Create a new status bar item.
  const characterCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000000)
  characterCount.command = undefined
  characterCount.show()

  function updateCharacterCount() {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      const document = editor.document
      const text = document.getText()
      characterCount.text = `${text.length} token${text.length === 1 ? '' : 's'}`
      characterCount.show()
    }
  }

  context.subscriptions.push(
    characterCount,
    vscode.window.onDidChangeActiveTextEditor(
      editor => {
        activeEditor = editor
        if (editor && editor.document.languageId === 'glass') {
          updateDecorations(editor, codeDecorations)
          updateCharacterCount()
        } else {
          characterCount.hide()
        }
      },
      null,
      context.subscriptions
    ),
    vscode.workspace.onDidChangeTextDocument(
      editor => {
        if (activeEditor && editor.document === activeEditor.document) {
          updateDecorations(activeEditor, codeDecorations)
          updateCharacterCount()
        }
      },
      null,
      context.subscriptions
    ),
    // vscode.workspace.onDidCloseTextDocument(document => diagnosticCollection.delete(document.uri))
    vscode.commands.registerCommand('glass.playground', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || activeEditor.document.languageId !== 'glass') {
        return
      }
      const filename = getDocumentFilename(activeEditor.document)
      const config = vscode.workspace.getConfiguration('glass')
      const openaiKey = config.get('openaiKey') as string | undefined

      if (openaiKey == null || openaiKey === '') {
        await vscode.window.showErrorMessage('Set `glass.openaiKey` in your VSCode preferences to run Glass files.')
        return
      }

      const panel = vscode.window.createWebviewPanel(
        'glass.webView', // viewType
        `${filename} (playground)`, // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      )
      panel.webview.html = getHtmlForWebview(panel.webview, context.extensionUri)
      panel.webview.onDidReceiveMessage(async (message: any) => {
        switch (message.action) {
          case 'getFilename':
            await panel.webview.postMessage({
              action: 'setFilename',
              data: {
                filename,
              },
            })
            break
          case 'getBlocks':
            // const blocks = await executeGlassFile(activeEditor.document, {})
            // await panel.webview.postMessage({
            //   action: 'setBlocks',
            //   data: {
            //     filename,
            //     blocks,
            //   },
            // })
            break
          case 'createBlock':
            const text = message.data.text

            break
          default:
            break
        }
      })
    }),
    vscode.commands.registerCommand('glass.run', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || activeEditor.document.languageId !== 'glass') {
        return
      }

      const config = vscode.workspace.getConfiguration('glass')
      const openaiKey = config.get('openaiKey') as string | undefined
      const defaultChatModel = config.get('defaultChatModel') as string | undefined

      if (openaiKey == null || openaiKey === '') {
        await vscode.window.showErrorMessage('Set `glass.openaiKey` in your VSCode preferences to run Glass files.')
        return
      }

      // get the current cursor position
      const cursorPosition = activeEditor.selection.active
      let firstLoad = true
      try {
        const resp = await executeGlassFile(activeEditor.document, {}, async ({ nextDoc, rawResponse }) => {
          const currentText = activeEditor.document.getText()
          if (firstLoad) {
            const maxRange = activeEditor.document.validateRange(
              new vscode.Range(
                new vscode.Position(0, 0),
                new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
              )
            )
            await activeEditor.edit(editBuilder => {
              editBuilder.replace(maxRange, nextDoc)
            })
            firstLoad = false
            return
          }
          if (!currentText.includes('█') && !firstLoad) {
            return
          }
          console.log('progress', { nextDoc, rawResponse })
          const lines = activeEditor.document.getText().split('\n')
          const blockCharacterLineIndex = lines.findIndex(line => line.includes('█'))
          const blockCharacterLine = lines[blockCharacterLineIndex]
          // find the line of the <Assistant> tag that was before the blockCharacterLine
          let startAssistantIndex = blockCharacterLineIndex
          for (let i = blockCharacterLineIndex; i >= 0; i--) {
            if (lines[i].includes('<Assistant>')) {
              startAssistantIndex = i
              break
            }
          }

          // Replace the entire range between "<Assistant>" and "</Assistant>"
          void activeEditor.edit(editBuilder => {
            editBuilder.replace(
              new vscode.Range(
                new vscode.Position(startAssistantIndex + 1, 0),
                new vscode.Position(blockCharacterLineIndex, blockCharacterLine.length)
              ),
              `${rawResponse}█`
            )
          })
        })

        while (activeEditor.document.getText().includes('█')) {
          await activeEditor.edit(editBuilder => {
            const lines = activeEditor.document.getText().split('\n')
            const blockCharacterLineIndex = lines.findIndex(line => line.includes('█'))
            const blockCharacterLine = lines[blockCharacterLineIndex]
            editBuilder.replace(
              new vscode.Range(
                new vscode.Position(blockCharacterLineIndex, blockCharacterLine.indexOf('█')),
                new vscode.Position(blockCharacterLineIndex, blockCharacterLine.indexOf('█') + 1)
              ),
              ''
            )
          })
        }

        // Move the cursor to between the User tags
        const lastLineIndex = activeEditor.document.lineCount
        activeEditor.selection = new vscode.Selection(
          new vscode.Position(lastLineIndex - 4, 0),
          new vscode.Position(lastLineIndex - 4, 0)
        )
      } catch (error) {
        console.error(error)
        void vscode.window.showErrorMessage(`ERROR: ${error}`)
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
    }),
    vscode.commands.registerCommand('glass.transpileCurrentFileNext', async () => {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        const document = editor.document
        const filePath = document.uri.fsPath
        try {
          const file = filePath.split('/').slice(-1)[0]
          const code = transpileGlassNext(
            path.dirname(filePath),
            filePath,
            'typescript',
            path.join(path.dirname(filePath))
          )

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
