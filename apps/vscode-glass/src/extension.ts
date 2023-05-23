import {
  parseGlassTopLevelJsxElements,
  transpileGlass,
  transpileGlassNext,
  transpileGlassPython,
} from '@glass-lang/glassc'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { LeftPanelWebview } from './LeftPanelWebview'
import { executeGlassFile } from './executeGlassFile'
import { executeGlassFilePython } from './executeGlassFilePython'
import { updateDecorations } from './util/decorations'
import { hasGlassFileOpen, isGlassFile } from './util/isGlassFile'
import { getOpenaiKey } from './util/keys'
import { updateLanguageMode } from './util/languageMode'

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
      documentSelector: [
        { scheme: 'file', language: 'glass' },
        { scheme: 'file', language: 'glass-py' },
      ],
      outputChannelName: 'Glass Language Server',
    }
  )
  await client.start()

  const leftPanelWebViewProvider = new LeftPanelWebview(context?.extensionUri, {})

  let activeEditor = vscode.window.activeTextEditor

  const codeDecorations: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('glass.code.background'),
    isWholeLine: true,
  })

  if (activeEditor) {
    updateDecorations(activeEditor, codeDecorations)
  }

  const characterCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000000)
  characterCount.command = undefined
  // characterCount.show()

  function updateCharacterCount() {
    // const editor = vscode.window.activeTextEditor
    // if (editor) {
    //   const document = editor.document
    //   const text = document.getText()
    //   characterCount.text = `${text.length} token${text.length === 1 ? '' : 's'}`
    //   characterCount.show()
    // }
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('glass', leftPanelWebViewProvider),
    characterCount,
    vscode.window.onDidChangeActiveTextEditor(
      async editor => {
        activeEditor = editor
        if (editor && isGlassFile(editor.document)) {
          updateDecorations(editor, codeDecorations)
          updateCharacterCount()
          await updateLanguageMode(editor.document)
        } else {
          characterCount.hide()
        }
      },
      null,
      context.subscriptions
    ),
    vscode.workspace.onDidChangeTextDocument(
      async editor => {
        if (activeEditor && editor.document === activeEditor.document) {
          updateDecorations(activeEditor, codeDecorations)
          updateCharacterCount()
          await updateLanguageMode(editor.document)
        }
      },
      null,
      context.subscriptions
    ),
    vscode.commands.registerCommand('glass.openSupportChat', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.glass')
    }),
    vscode.commands.registerCommand('glass.reset', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || activeEditor.document.languageId !== 'glass') {
        return
      }
      try {
        let parsed: any[] = parseGlassTopLevelJsxElements(activeEditor.document.getText())
        let generatedTags = parsed.filter(
          tag =>
            tag.tagName === 'State' ||
            (['User', 'Assistant'].includes(tag.tagName) && tag.attrs.some((attr: any) => attr.name === 'generated'))
        )
        while (generatedTags.length > 0) {
          const tag = generatedTags[0]
          await activeEditor.edit(editBuilder => {
            editBuilder.delete(
              new vscode.Range(
                activeEditor.document.positionAt(tag.position.start.offset),
                activeEditor.document.positionAt(tag.position.end.offset)
              )
            )
          })
          parsed = parseGlassTopLevelJsxElements(activeEditor.document.getText())
          generatedTags = parsed.filter(
            tag =>
              ['User', 'Assistant'].includes(tag.tagName) && tag.attrs.some((attr: any) => attr.name === 'generated')
          )
        }
      } catch {
        await vscode.window.showErrorMessage('Unable to parse this Glass file')
      }
    }),
    vscode.commands.registerCommand('glass.run', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        return
      }

      const openaiKey = getOpenaiKey()
      const config = vscode.workspace.getConfiguration('glass')
      const defaultChatModel = config.get('defaultChatModel') as string | undefined

      if (openaiKey == null || openaiKey === '') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'glass.openaiKey')
        await vscode.window.showErrorMessage('Add OpenAI API key to run Glass files.')
        return
      }

      if (activeEditor.document.languageId === 'glass-py') {
        await executeGlassFilePython(activeEditor.document, {})
        return
      }

      // get the current cursor position
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
            const lastLineIndex = activeEditor.document.lineCount
            const targetPosition = new vscode.Position(lastLineIndex - 2, 0)
            activeEditor.selection = new vscode.Selection(targetPosition, targetPosition)
            activeEditor.revealRange(new vscode.Range(targetPosition, targetPosition))
            firstLoad = false
            return
          }
          if (!currentText.includes('█') && !firstLoad) {
            return
          }

          const lines = activeEditor.document.getText().split('\n')
          const blockCharacterLineIndex = lines.findIndex(line => line.includes('█'))
          const blockCharacterLine = lines[blockCharacterLineIndex]
          // find the line of the <Assistant generated={true}> tag that was before the blockCharacterLine
          let startAssistantIndex = blockCharacterLineIndex
          for (let i = blockCharacterLineIndex; i >= 0; i--) {
            if (lines[i].includes('<Assistant generated={true}>')) {
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
          const lastLineIndex = activeEditor.document.lineCount
          const targetPosition = new vscode.Position(lastLineIndex - 2, 0)
          activeEditor.revealRange(new vscode.Range(targetPosition, targetPosition))
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
        const file = filePath.split('/').slice(-1)[0]
        try {
          const code =
            document.languageId === 'glass-py'
              ? transpileGlassPython(filePath, filePath, 'python', path.join(path.dirname(filePath)))
              : transpileGlass(filePath, filePath, 'typescript', path.join(path.dirname(filePath)))
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
    }),

    vscode.commands.registerCommand('glass.runPython', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        return
      }

      const config = vscode.workspace.getConfiguration('glass')
      const openaiKey = getOpenaiKey()
      const defaultChatModel = config.get('defaultChatModel') as string | undefined

      if (openaiKey == null || openaiKey === '') {
        await vscode.window.showErrorMessage('Set `glass.openaiKey` in your settings to run Glass files.')
        return
      }

      // get the current cursor position
      const cursorPosition = activeEditor.selection.active

      const resp = await executeGlassFilePython(activeEditor.document, {})
      console.log('execute glass file python returned', JSON.stringify({ resp }))
    })
  )
}

// This method is called when your extension is deactivated
export async function deactivate() {
  if (client) {
    return await client.stop()
  }
}
