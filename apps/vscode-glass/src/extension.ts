import { transpileGlass } from '@glass-lang/glassc'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { handleStreamResponse } from './api'
import { executeGlassFile } from './executeGlassFile'
import { updateDecorations } from './util/decorations'
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

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(
      editor => {
        activeEditor = editor
        if (editor) {
          updateDecorations(editor, codeDecorations)
        }
      },
      null,
      context.subscriptions
    ),
    vscode.workspace.onDidChangeTextDocument(
      editor => {
        if (activeEditor && editor.document === activeEditor.document) {
          updateDecorations(activeEditor, codeDecorations)
        }
      },
      null,
      context.subscriptions
    )
    // vscode.workspace.onDidCloseTextDocument(document => diagnosticCollection.delete(document.uri))
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('glass.run', async context => {
      const config = vscode.workspace.getConfiguration('glass')
      const openaiKey = config.get('openaiKey') as string | undefined

      if (openaiKey == null || openaiKey === '') {
        await vscode.window.showErrorMessage('Set `glass.openaiKey` in your settings to run Glass files.')
        return
      }

      const panel = vscode.window.createWebviewPanel(
        'glassNewTab', // viewType
        'Glass Webview', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        } // Webview options.
      )
      panel.webview.html = getHtmlForWebview(panel.webview, context)
      panel.webview.onDidReceiveMessage(async (message: any) => {
        // Handle messages from the webview
      })
    }),
    vscode.commands.registerCommand('glass.completion', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || activeEditor.document.languageId !== 'glass') {
        return
      }

      const config = vscode.workspace.getConfiguration('glass')
      const openaiKey = config.get('openaiKey') as string | undefined

      if (openaiKey == null || openaiKey === '') {
        await vscode.window.showErrorMessage('Set `glass.openaiKey` in your settings to run Glass files.')
        return
      }

      // Add Assistant tags to the end of the document
      await activeEditor.edit(editBuilder => {
        const lastLine = activeEditor.document.lineCount
        editBuilder.insert(new vscode.Position(lastLine, 0), '\n\n<Assistant>\n█\n</Assistant>')
      })

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
              `${newResult}█`
            )
          })
          return newResult
        }
        return currResult
      })

      // Add User tags to the end of the document
      await activeEditor.edit(editBuilder => {
        const lastLine = activeEditor.document.lineCount
        editBuilder.insert(new vscode.Position(lastLine, 0), '\n\n<User>\n\n</User>')
      })

      // remove the block character
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

      // Move the cursor to between the User tags
      const lastLine = activeEditor.document.lineCount
      activeEditor.selection = new vscode.Selection(
        new vscode.Position(lastLine - 2, 0),
        new vscode.Position(lastLine - 2, 0)
      )
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
