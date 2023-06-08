import { parseGlassMetadata, parseGlassMetadataPython } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseGlassBlocks,
  parseGlassBlocksRecursive,
  parseGlassTranscriptBlocks,
} from '@glass-lang/glasslib'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import * as vscode from 'vscode'
import { executeGlassFile } from '../runGlassExtension'
import { getHtmlForWebview } from '../webview'
import { getDocumentFilename } from './isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './keys'
import { updateLanguageMode } from './languageMode'
import {
  createSession,
  getCurrentSessionFilepath,
  getSessionDirectoryPath,
  getSessionFilepath,
  getSessionId,
  loadGlass,
  loadSessionDocuments,
  writeGlass,
} from './session'
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
  const sessionId = getSessionId(session)
  if (!session || !sessionId) {
    return
  }

  const languageId = document.languageId
  const existingPlayground = playgrounds.get(filepath)
  if (existingPlayground) {
    playgrounds.set(filepath, existingPlayground)
    const currentGlass = loadGlass(sessionId, filepath)
    const allBlocks = parseGlassBlocks(currentGlass)
    const currentBlocks = parseGlassTranscriptBlocks(currentGlass)
    const currentMetadata =
      languageId === 'glass-py' ? await parseGlassMetadataPython(currentGlass) : parseGlassMetadata(currentGlass)
    await existingPlayground.panel.webview.postMessage({
      action: 'setGlass',
      data: {
        filename: filepath.split('/').pop(),
        sessionId: sessionId,
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
  const initialMetadata = parseGlassMetadata(initialGlass)
  const filename = filepath.split('/').pop()

  // If there's no existing panel, create a new one
  const panel = vscode.window.createWebviewPanel(
    'glass.webView',
    `${filename} (playground)`,
    {
      viewColumn: getCurrentViewColumn(playgrounds),
      preserveFocus: initialMetadata.interpolationVariables.length === 0,
    },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
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
        const stopSessionId = message.data.sessionId
        let stoppedGlass = loadGlass(stopSessionId, filepath)
        stoppedGlass = stoppedGlass.replace('█', '')
        stoppedRequestIds.add(stopRequestId)
        writeGlass(stopSessionId, filepath, stoppedGlass)
        const stoppedBlocks = parseGlassTranscriptBlocks(stoppedGlass)
        const stoppedMetadata =
          languageId === 'glass-py' ? await parseGlassMetadataPython(initialGlass) : parseGlassMetadata(stoppedGlass)
        await panel.webview.postMessage({
          action: 'onStream',
          data: {
            sessionId: stopSessionId,
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
          const sessionBlocks = parseGlassTranscriptBlocks(sessionGlass)
          const lastBlock = sessionBlocks.length > 0 ? sessionBlocks[sessionBlocks.length - 1] : null
          return {
            id: getDocumentFilename(sessionDocument).replace('.glass', ''),
            numMessages: sessionBlocks.length,
            lastMessage: lastBlock?.child?.content ?? '(no messages)',
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
        const currentSessionId = getSessionId(currentSession)
        if (!currentSession || !currentSessionId) {
          await vscode.window.showErrorMessage('No session found')
          return
        }
        const currentGlass = loadGlass(currentSessionId, filepath)
        const allBlocks = parseGlassBlocks(currentGlass)
        const currentBlocks = parseGlassTranscriptBlocks(currentGlass)
        const currentMetadata =
          languageId === 'glass-py' ? await parseGlassMetadataPython(currentGlass) : parseGlassMetadata(currentGlass)
        const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme')
        await panel.webview.postMessage({
          action: 'setGlass',
          data: {
            filename: filepath.split('/').pop(),
            sessionId: currentSessionId,
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
        const newSessionId = getSessionId(newSession)
        if (!newSession || !newSessionId) {
          await vscode.window.showErrorMessage('Unable to reset session')
          return
        }
        const newGlass = loadGlass(newSessionId, filepath)
        const newBlocks = parseGlassTranscriptBlocks(newGlass)
        const newAllBlocks = parseGlassBlocks(newGlass)
        const newMetadata =
          languageId === 'glass-py' ? await parseGlassMetadataPython(newGlass) : parseGlassMetadata(newGlass)
        await panel.webview.postMessage({
          action: 'setGlass',
          data: {
            sessionId: newSessionId,
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
        const sessionIdToOpen = message.data.sessionId
        if (!sessionIdToOpen) {
          await vscode.window.showErrorMessage('No session found')
          return
        }
        const sessionDirectoryPath = getSessionDirectoryPath(filepath)
        const sessionFilepath = path.join(sessionDirectoryPath, `${sessionIdToOpen}.glass`)
        try {
          const newSessionFile = await vscode.workspace.openTextDocument(sessionFilepath)
          await vscode.window.showTextDocument(newSessionFile, {
            viewColumn: getCurrentViewColumn(playgrounds),
            preview: false,
          })
        } catch {
          await vscode.window.showErrorMessage('Unable to open session file')
        }
        break
      case 'shareSessionGist':
        const sessionIdToShare = message.data.sessionId
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (!process.env.GITHUB_API_KEY) {
          await vscode.window.showErrorMessage('No GitHub API key found')
          return
        }
        const sessionToShareFilepath = getSessionFilepath(sessionToShare)
        try {
          const newSessionFile = await vscode.workspace.openTextDocument(sessionToShareFilepath)
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
              [session.filename]: {
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
        async function runGlassExtension(glass: string, sessionId: string, inputs: any) {
          const elements = parseGlassBlocksRecursive(glass)
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

          const session = sessions.get(sessionId)
          if (!session) {
            await vscode.window.showErrorMessage('No session found')
            return
          }

          const origFilePath = session.filepath
          const newFilePath = getSessionFilepath(session)
          const sessionDocument = await vscode.workspace.openTextDocument(newFilePath)

          try {
            const requestId = generateULID()
            await updateLanguageMode(sessionDocument)
            const resp = await executeGlassFile(
              origFilePath,
              outputChannel,
              sessionDocument,
              glass,
              inputs,
              async ({ nextDoc }) => {
                const existingPlayground = playgrounds.get(filepath)
                if (!existingPlayground || sessionId !== existingPlayground.sessionId) {
                  return false
                }
                const session = sessions.get(existingPlayground.sessionId)
                if (!session || stoppedRequestIds.has(requestId)) {
                  return false
                }
                writeGlass(session, nextDoc)
                const blocksForGlass = parseGlassTranscriptBlocks(nextDoc)
                const metadataForGlass =
                  languageId === 'glass-py' ? await parseGlassMetadataPython(nextDoc) : parseGlassMetadata(nextDoc)
                await panel.webview.postMessage({
                  action: 'onStream',
                  data: {
                    sessionId: session.id,
                    blocks: blocksForGlass,
                    variables: metadataForGlass.interpolationVariables,
                    requestId,
                  },
                })
                return true
              }
            )

            const existingPlayground = playgrounds.get(filepath)
            if (!existingPlayground || sessionId !== existingPlayground.sessionId) {
              return false
            }
            const session = sessions.get(existingPlayground.sessionId)
            if (!session || stoppedRequestIds.has(requestId)) {
              return false
            }
            const blocksForGlass = parseGlassTranscriptBlocks(resp.finalDoc)
            const metadataForGlass =
              languageId === 'glass-py'
                ? await parseGlassMetadataPython(resp.finalDoc)
                : parseGlassMetadata(resp.finalDoc)

            writeGlass(session, resp.finalDoc) // wait for this?
            await panel.webview.postMessage({
              action: 'onResponse',
              data: {
                sessionId: sessionId,
                glass: resp.finalDoc,
                blocks: blocksForGlass,
                variables: metadataForGlass.interpolationVariables,
                model,
                inputs,
                output: resp.rawResponse,
              },
            })
            if (resp.continued) {
              console.log('continuing execution...')
              await runGlassExtension(resp.finalDoc, sessionId, inputs)
            }
          } catch (error) {
            console.error(error)
            void vscode.window.showErrorMessage(`ERROR: ${error}`)
          }
        }
        const sessionId = message.data.sessionId
        const activeSession = sessions.get(sessionId)
        if (sessionId == null || !activeSession) {
          await vscode.window.showErrorMessage('No session provided')
          return
        }
        sessions.set(sessionId, activeSession)
        const glass = loadGlass(activeSession)
        const inputs = message.data.inputs
        if (inputs == null) {
          await vscode.window.showErrorMessage('No inputs provided')
          return
        }
        await runGlassExtension(glass, sessionId, inputs)
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
    sessionId: session.id,
  }
  playgrounds.set(filepath, newPlayground)
  return newPlayground
}
