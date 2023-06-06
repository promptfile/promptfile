import {
  parseGlassMetadata,
  parseGlassMetadataPython,
  transpileGlassPython,
  transpileGlassTypescript,
} from '@glass-lang/glassc'
import { LANGUAGE_MODELS, LanguageModelCreator, parseGlassBlocksRecursive } from '@glass-lang/glasslib'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { executeTestSuite } from './executeTestSuite'
import { updateDecorations } from './util/decorations'
import { getDocumentFilename, hasGlassFileOpen, isGlassFile } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'
import { updateLanguageMode } from './util/languageMode'
import { GlassPlayground, createPlayground } from './util/playground'
import { GlassSession } from './util/session'
import { updateTokenCount } from './util/tokenCounter'
import { transpileCurrentFile } from './util/transpile'
import { getCurrentViewColumn } from './util/viewColumn'

let client: LanguageClient | null = null

const sessions = new Map<string, GlassSession>()
const playgrounds = new Map<string, GlassPlayground>()

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
        { scheme: 'file', language: 'glass-py`' },
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
          const existingPlayground = playgrounds.get(editor.document.uri.fsPath)
          if (existingPlayground) {
            await existingPlayground.panel.webview.postMessage({
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
        const requestElement = elements.find(element => element.tag === 'Request')
        if (!requestElement) {
          await vscode.window.showErrorMessage('Unable to find Request element')
          return
        }
        const model = requestElement.attrs?.find((attr: any) => attr.name === 'model')?.stringValue
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
    vscode.commands.registerCommand('glass.openPlayground', async () => {
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
      const playground = await createPlayground(filepath, playgrounds, sessions, context.extensionUri, outputChannel)
      if (!playground) {
        await vscode.window.showErrorMessage('Unable to create playground')
        return
      }
      playground.panel.reveal(getCurrentViewColumn(playgrounds), initialMetadata.interpolationVariables.length === 0)
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
              output = transpileGlassTypescript(folderPath, folderPath, languageMode, outDir)
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
