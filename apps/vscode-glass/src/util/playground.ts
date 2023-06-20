import { parseGlassMetadata } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseChatBlocks,
  parseGlassBlocks,
  parseGlassDocument,
} from '@glass-lang/glasslib'
import fs from 'fs'
import fetch from 'node-fetch'
import * as vscode from 'vscode'
import { executeGlassFile } from '../runGlassExtension'
import { getHtmlForWebview } from '../webview'
import { getAnthropicKey, getOpenaiKey } from './keys'
import { createSession, getCurrentSessionFilepath, loadGlass, loadSessionDocuments, writeGlass } from './session'
import { generateULID } from './ulid'
import { getCurrentViewColumn } from './viewColumn'

export interface GlassPlayground {
  filepath: string
  panel: vscode.WebviewPanel
}

export async function createPlayground(
  filepath: string,
  playgrounds: Map<string, GlassPlayground>,
  extensionUri: vscode.Uri,
  outputChannel: vscode.OutputChannel,
  stoppedRequestIds: Set<string>
) {
  // load the document at the filepath
  const document = await vscode.workspace.openTextDocument(filepath)
  if (!document) {
    return
  }
  const session = await createSession(filepath)
  if (!session) {
    return
  }
  const languageId = document.languageId
  const existingPlayground = playgrounds.get(filepath)
  if (existingPlayground) {
    const currentGlass = loadGlass(session)
    const allBlocks = parseGlassBlocks(currentGlass)
    const currentBlocks = parseChatBlocks(currentGlass)
    const currentMetadata = parseGlassMetadata(currentGlass)
    await existingPlayground.panel.webview.postMessage({
      action: 'setGlass',
      data: {
        filename: filepath.split('/').pop(),
        session: session,
        glass: currentGlass,
        blocks: currentBlocks,
        variables: currentMetadata.interpolationVariables,
        currentSource: currentGlass,
        source: currentGlass,
        testing: allBlocks.some(block => block.tag === 'Test'),
      },
    })
    return existingPlayground
  }

  const initialGlass = fs.readFileSync(filepath, 'utf-8')
  const filename = filepath.split('/').pop()

  // If there's no existing panel, create a new one
  const panel = vscode.window.createWebviewPanel(
    'glass.webView',
    `${filename} (playground)`,
    {
      viewColumn: getCurrentViewColumn(playgrounds),
      preserveFocus: true,
    },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      enableFindWidget: true,
    }
  )

  // When the panel is disposed, remove it from the map
  panel.onDidDispose(() => {
    playgrounds.delete(filepath)
  })
  panel.webview.html = getHtmlForWebview(panel.webview, extensionUri)

  panel.webview.onDidReceiveMessage(async (message: any) => {
    switch (message.action) {
      case 'stopSession':
        const stopRequestId = message.data.requestId
        const stopSession = message.data.session
        let stoppedGlass = loadGlass(stopSession)
        stoppedGlass = stoppedGlass.replace('█', '')
        stoppedRequestIds.add(stopRequestId)
        writeGlass(stopSession, stoppedGlass)
        const stoppedBlocks = parseChatBlocks(stoppedGlass)
        const stoppedMetadata = parseGlassMetadata(stoppedGlass)
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
      case 'getSessions':
        const sessionDocuments = await loadSessionDocuments(filepath)
        const sessionSummaries = sessionDocuments.map(sessionDocument => {
          const sessionGlass = sessionDocument.getText()
          const sessionBlocks = parseChatBlocks(sessionGlass)
          const lastBlock = sessionBlocks.length > 0 ? sessionBlocks[sessionBlocks.length - 1] : null
          return {
            session: sessionDocument.uri.fsPath,
            numMessages: sessionBlocks.length,
            lastMessage: lastBlock?.content ?? '(no messages)',
          }
        })
        await panel.webview.postMessage({
          action: 'setSessions',
          data: {
            sessions: sessionSummaries,
          },
        })
        break
      case 'getCurrentSession':
        const currentSession = getCurrentSessionFilepath(filepath)
        if (!currentSession) {
          await vscode.window.showErrorMessage('No session found')
          return
        }
        const currentGlass = loadGlass(currentSession)
        const allBlocks = parseGlassBlocks(currentGlass)
        const currentBlocks = parseChatBlocks(currentGlass)
        const currentMetadata = parseGlassMetadata(currentGlass)
        const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme')
        await panel.webview.postMessage({
          action: 'setGlass',
          data: {
            filename: filepath.split('/').pop(),
            session: currentSession,
            glass: currentGlass,
            blocks: currentBlocks,
            variables: currentMetadata.interpolationVariables,
            currentSource: currentGlass,
            source: currentGlass,
            testing: allBlocks.some(block => block.tag === 'Test'),
            theme,
          },
        })
        break
      case 'resetSession':
        const newSession = await createSession(filepath)
        if (!newSession) {
          await vscode.window.showErrorMessage('Unable to reset session')
          return
        }
        const newGlass = loadGlass(newSession)
        const newBlocks = parseChatBlocks(newGlass)
        const newAllBlocks = parseGlassBlocks(newGlass)
        const newMetadata = parseGlassMetadata(newGlass)
        await panel.webview.postMessage({
          action: 'setGlass',
          data: {
            session: newSession,
            glass: newGlass,
            blocks: newBlocks,
            variables: newMetadata.interpolationVariables,
            source: newGlass,
            currentSource: newGlass,
            testing: newAllBlocks.some(block => block.tag === 'Test'),
          },
        })
        break
      case 'openSessionFile':
        try {
          const newSessionFile = await vscode.workspace.openTextDocument(message.data.session)
          await vscode.window.showTextDocument(newSessionFile, {
            viewColumn: getCurrentViewColumn(playgrounds),
            preview: false,
          })
        } catch {
          await vscode.window.showErrorMessage('Unable to open session file')
        }
        break
      case 'shareSessionGist':
        const sessionToShare = message.data.session
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (!process.env.GITHUB_API_KEY) {
          await vscode.window.showErrorMessage('No GitHub API key found')
          return
        }
        try {
          const newSessionFile = await vscode.workspace.openTextDocument(sessionToShare)
          const url = 'https://api.github.com/gists'
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          const accessToken = process.env.GITHUB_API_KEY

          const description = await vscode.window.showInputBox({
            prompt: 'Enter a description for your gist',
          })

          const gistToCreate = {
            description: description || '(no description)',
            public: false,
            files: {
              [filename ?? 'unknown']: {
                content: newSessionFile.getText(),
              },
            },
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `token ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify(gistToCreate),
          })

          const data = (await response.json()) as any

          if (!response.ok) {
            throw new Error(`GitHub Gist API error: ${JSON.stringify(data)}`)
          }

          await vscode.env.clipboard.writeText(data.html_url)
          await vscode.window.showInformationMessage(`Copied gist URL to clipboard`)
        } catch (e: any) {
          await vscode.window.showErrorMessage(`Unable to save gist: ${e.message}`)
        }
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
      case 'runSession':
        async function runGlassExtension(glass: string, sessionToRun: string, inputs: any) {
          const elements = parseGlassDocument(glass)
          const requestElement = elements.find(element => element.tag && ['Request', 'Chat'].includes(element.tag))
          const model = requestElement?.attrs?.find((attr: any) => attr.name === 'model')?.stringValue
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

          // Ensure a workspace is opened
          if (!vscode.workspace.workspaceFolders) {
            await vscode.window.showErrorMessage('No workspace opened')
            return
          }

          const sessionDocument = await vscode.workspace.openTextDocument(sessionToRun)

          try {
            const requestId = generateULID()
            const resp = await executeGlassFile(
              filepath,
              outputChannel,
              sessionDocument,
              glass,
              inputs,
              async ({ nextGlassfile }) => {
                const existingPlayground = playgrounds.get(filepath)
                if (!existingPlayground || stoppedRequestIds.has(requestId)) {
                  return false
                }
                writeGlass(sessionToRun, nextGlassfile)
                const blocksForGlass = parseChatBlocks(nextGlassfile)
                const metadataForGlass = parseGlassMetadata(nextGlassfile)
                await panel.webview.postMessage({
                  action: 'onStream',
                  data: {
                    session: sessionToRun,
                    blocks: blocksForGlass,
                    variables: metadataForGlass.interpolationVariables,
                    requestId,
                  },
                })
                return true
              }
            )

            const existingPlayground = playgrounds.get(filepath)
            if (!existingPlayground || stoppedRequestIds.has(requestId)) {
              return false
            }
            const newGlassfile = `${resp.nextGlassfile}

<User>
@{input}
</User>

<Request model="${model}" />`
            const blocksForGlass = parseChatBlocks(newGlassfile)
            const metadataForGlass = parseGlassMetadata(newGlassfile)
            console.log(metadataForGlass)
            writeGlass(sessionToRun, newGlassfile) // wait for this?
            await panel.webview.postMessage({
              action: 'onResponse',
              data: {
                session: sessionToRun,
                glass: newGlassfile,
                blocks: blocksForGlass,
                variables: metadataForGlass.interpolationVariables,
                model,
              },
            })
          } catch (error) {
            console.error(error)
            void vscode.window.showErrorMessage(`ERROR: ${error}`)
          }
        }
        const sessionToRun = message.data.session
        const glass = loadGlass(sessionToRun)
        const inputs = message.data.inputs
        if (inputs == null) {
          await vscode.window.showErrorMessage('No inputs provided')
          return
        }
        await runGlassExtension(glass, sessionToRun, inputs)
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
  const newPlayground = {
    filepath,
    panel,
  }
  playgrounds.set(filepath, newPlayground)
  return newPlayground
}
