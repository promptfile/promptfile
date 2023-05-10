// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-glass" is now active!')

  // await executeGlassFile()

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('vscode-glass.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from vscode-glass!')
  })

  let activeEditor = vscode.window.activeTextEditor

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

  const codeDecorations = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('glass.block.background'),
    isWholeLine: true,
  })

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

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {
  // nothing to do
}
