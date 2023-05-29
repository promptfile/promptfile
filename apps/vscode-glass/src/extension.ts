import { parseGlassMetadata, transpileGlassNext, transpileGlassPython } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  getJSXNodeInsidesString,
  parseGlassBlocks,
  parseGlassTopLevelJsxElements,
} from '@glass-lang/glasslib'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'
import { executeGlassFile } from './executeGlassFile'
import { executeTestSuite } from './executeTestSuite'
import { updateDecorations } from './util/decorations'
import { getDocumentFilename, getNonce, hasGlassFileOpen, isGlassFile } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'
import { updateLanguageMode } from './util/languageMode'
import { updateTokenCount } from './util/tokenCounter'
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
        }
      },
      null,
      context.subscriptions
    ),
    vscode.commands.registerCommand('glass.openSupportChat', async () => {
      await vscode.window.showInformationMessage('Opening support chat...')
    }),
    vscode.commands.registerCommand('glass.reset', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !isGlassFile(activeEditor.document)) {
        return
      }
      try {
        let parsed: any[] = parseGlassTopLevelJsxElements(activeEditor.document.getText())
        const generatedTags = parsed.filter(tag => tag.tagName === 'State')
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
        }
      } catch {
        await vscode.window.showErrorMessage('Unable to parse this Glass file')
      }
      // call the document formatter
      await vscode.commands.executeCommand('editor.action.formatDocument')
    }),
    vscode.commands.registerCommand('glass.runTestSuite', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        console.log('no active editor with glassfile')
        return
      }

      try {
        const elements = parseGlassTopLevelJsxElements(activeEditor.document.getText())
        const chatElement = elements.find(element => element.tagName === 'Request')
        const model =
          chatElement?.attrs.find((attr: any) => attr.name === 'model')?.stringValue ??
          (vscode.workspace.getConfiguration('glass').get('defaultChatModel') as string)
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

      console.log('about to run test suite')

      const resp = await executeTestSuite(activeEditor.document, {}, activeEditor.document.languageId === 'glass-py')

      console.log('test results')
      console.log(JSON.stringify(resp, null, 2))
    }),
    vscode.commands.registerCommand('glass.openPlayground', async () => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        return
      }
      const initialGlass = activeEditor.document.getText()
      const languageId = activeEditor.document.languageId
      const filename = getDocumentFilename(activeEditor.document)
      // Get the directory of the current file
      const currentDir = path.dirname(activeEditor.document.uri.fsPath)

      const panel = vscode.window.createWebviewPanel(
        'glass.webView',
        `${filename} (playground)`,
        vscode.ViewColumn.Beside,
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
                languageId,
              },
            })
            break
          case 'runPlayground':
            const values = message.data.values
            if (values == null) {
              await vscode.window.showErrorMessage('No values provided')
              return
            }

            // Define the new file's path. This places it in the same directory
            // as the current file.
            const playgroundId = getNonce()
            const newFilePath = path.join(currentDir, filename.replace('.glass', `${playgroundId}.glass`))
            fs.writeFileSync(newFilePath, initialGlass)

            // load the textdocument from newFilePath
            const playgroundDocument = await vscode.workspace.openTextDocument(newFilePath)

            try {
              const resp = await executeGlassFile(
                playgroundDocument,
                values,
                playgroundDocument.languageId === 'glass-py',
                async ({ nextDoc, rawResponse }) => {
                  console.log(nextDoc)
                  // const blocksForGlass = parseGlassBlocks(nextDoc)
                  const metadataForGlass = parseGlassMetadata(nextDoc)
                  await panel.webview.postMessage({
                    action: 'setGlass',
                    data: {
                      filename,
                      glass: nextDoc,
                      blocks: [],
                      variables: metadataForGlass.interpolationVariables,
                    },
                  })
                  return true
                }
              )

              const blocksForGlass = parseGlassBlocks(resp.finalInterpolatedDoc)
              const metadataForGlass = parseGlassMetadata(resp.finalInterpolatedDoc)
              await panel.webview.postMessage({
                action: 'setGlass',
                data: {
                  filename,
                  glass: resp.finalInterpolatedDoc,
                  blocks: blocksForGlass,
                  variables: metadataForGlass.interpolationVariables,
                },
              })
            } catch (error) {
              console.error(error)
              void vscode.window.showErrorMessage(`ERROR: ${error}`)
            } finally {
              fs.unlinkSync(newFilePath)
            }
            break
          case 'getMetadata':
            const glassToParse = message.data.glass
            if (glassToParse == null) {
              await vscode.window.showErrorMessage('No glass provided')
              return
            }
            const metadata = parseGlassMetadata(glassToParse)
            const blocks = parseGlassBlocks(glassToParse)
            await panel.webview.postMessage({
              action: 'setMetadata',
              data: {
                variables: metadata.interpolationVariables,
                blocks: blocks,
              },
            })
            break
          case 'resetGlass':
            const metadataForGlass = parseGlassMetadata(initialGlass)
            await panel.webview.postMessage({
              action: 'setGlass',
              data: {
                filename,
                glass: initialGlass,
                blocks: [],
                variables: metadataForGlass.interpolationVariables,
              },
            })
            break
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
    vscode.commands.registerCommand('glass.typeahead', async () => {
      const activeEditor = vscode.window.activeTextEditor

      if (!activeEditor || !hasGlassFileOpen(activeEditor)) {
        return
      }

      try {
        const elements = parseGlassTopLevelJsxElements(activeEditor.document.getText())
        let requestElement = elements.find(element => element.tagName === 'Request')
        if (requestElement == null) {
          const loopElement = elements.find(element => element.tagName === 'Loop')
          if (loopElement != null) {
            const loopInsides = getJSXNodeInsidesString(loopElement, activeEditor.document.getText())
            const loopInsideElements = parseGlassTopLevelJsxElements(loopInsides)
            requestElement = loopInsideElements.find(element => element.tagName === 'Request')
          }
        }

        const model =
          requestElement?.attrs.find((attr: any) => attr.name === 'model')?.stringValue ??
          (vscode.workspace.getConfiguration('glass').get('defaultChatModel') as string)
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

      let firstLoad = true
      let cancelled = false
      let prevResponse = '█'
      try {
        const resp = await executeGlassFile(
          activeEditor.document,
          {},
          activeEditor.document.languageId === 'glass-py',
          async ({ nextDoc, rawResponse }) => {
            const currentText = activeEditor.document.getText()
            if (firstLoad) {
              const endOfFile = activeEditor.document.validateRange(
                new vscode.Range(
                  new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
                  new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
                )
              )
              await activeEditor.edit(editBuilder => {
                editBuilder.replace(endOfFile, `\n\n<Assistant>\n${rawResponse}\n</Assistant>`)
              })
              const lastLineIndex = activeEditor.document.lineCount
              const targetPosition = new vscode.Position(lastLineIndex - 2, 0)
              activeEditor.revealRange(new vscode.Range(targetPosition, targetPosition))
              firstLoad = false
              return
            }
            if (!currentText.includes('█') && !firstLoad) {
              cancelled = true
              return
            }

            if (cancelled || !rawResponse) {
              return
            }

            const lines = activeEditor.document.getText().split('\n')
            const blockCharacterLineIndex = lines.findIndex(line => line.includes('█'))

            // Check if prevResponse is still a prefix of rawResponse
            if (!rawResponse.startsWith(prevResponse)) {
              // If not, there might have been a missed chunk. Reset prevResponse.
              prevResponse = ''
            }

            const newResponse = rawResponse.substring(prevResponse.length)
            prevResponse = rawResponse

            void activeEditor.edit(editBuilder => {
              const endPosition = new vscode.Position(
                blockCharacterLineIndex,
                lines[blockCharacterLineIndex].indexOf('█')
              )
              editBuilder.insert(endPosition, `${newResponse}`)
            })
          }
        )

        if (cancelled) {
          return
        }

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

        const endOfFile = activeEditor.document.validateRange(
          new vscode.Range(
            new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
            new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
          )
        )
        await activeEditor.edit(editBuilder => {
          editBuilder.replace(endOfFile, `\n\n<User>\n\n</User>`)
        })

        const lastLineIndex = activeEditor.document.lineCount
        const targetPosition = new vscode.Position(lastLineIndex - 2, 0)
        activeEditor.selection = new vscode.Selection(targetPosition, targetPosition)
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
        const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri)!
        const outputDirectoryConfig: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any
        const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
        const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)

        const document = editor.document
        const filePath = document.uri.fsPath
        const file = filePath.split('/').slice(-1)[0]

        try {
          const code =
            document.languageId === 'glass-py'
              ? await transpileGlassPython(filePath, filePath, 'python', path.join(path.dirname(filePath)))
              : transpileGlassNext(workspacePath, filePath, 'typescript', outDir)
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
