// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { LeftPanelWebview, getInteroplationVariables, isFileWithDesiredExtension } from './LeftWebviewProvider'

let client: LanguageClient | null = null

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // The server is implemented in node
  const languageServerModule = context.asAbsolutePath('out/language-server.js')

  client = new LanguageClient(
    'Glass',
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
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
        { scheme: 'file', language: 'glass' },
        // { scheme: 'file', language: 'typescript' },
        // { scheme: 'file', language: 'typescriptreact' },
        // { scheme: 'file', language: 'javascript' },
        // { scheme: 'file', language: 'javascriptreact' },
      ],
    }
  )

  // Register rig view

  const leftPanelWebViewProvider = new LeftPanelWebview(context?.extensionUri, {})
  const view = vscode.window.registerWebviewViewProvider('left-panel-webview', leftPanelWebViewProvider)
  context.subscriptions.push(view)

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && isFileWithDesiredExtension(editor.document)) {
        const text = editor.document.getText()
        const vars = getInteroplationVariables(text)

        console.log('interpolationVariableNames from change active editor', vars)

        if (leftPanelWebViewProvider._view.webview) {
          console.log('posting a message')
          leftPanelWebViewProvider._view.webview.postMessage({
            command: 'updateInterpolationVariables',
            data: vars,
          })
        }
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (!event.document.fileName.endsWith('.glass')) {
        console.log('non-glass document changed')
        return
      }
      const activeEditor = vscode.window.activeTextEditor

      if (!activeEditor || activeEditor.document !== event.document) {
        // didn't modify active editor, ignoring
        console.log('not active editor')
        return
      }

      if (leftPanelWebViewProvider._view.webview) {
        const text = event.document.getText()
        const vars = getInteroplationVariables(text)

        leftPanelWebViewProvider._view.webview.postMessage({
          command: 'updateInterpolationVariables',
          data: vars,
        })
      } else {
        console.log('webview not ready')
      }
    })
  )

  // end register rig

  // await executeGlassFile()

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('vscode-glass.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    void vscode.window.showInformationMessage('Hello World from vscode-glass!')
  })

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

    console.log('highlights are', highlights)

    activeEditor.setDecorations(codeDecorations, highlights)
  }

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export async function deactivate() {
  if (client) {
    return await client.stop()
  }
}
