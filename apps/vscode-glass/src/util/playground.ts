import { parseGlassMetadata, parseGlassMetadataPython } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseGlassBlocksRecursive,
  parseGlassTranscriptBlocks,
} from '@glass-lang/glasslib'
import fs from 'fs'
import * as vscode from 'vscode'
import { executeGlassFile } from '../runGlassExtension'
import { getHtmlForWebview } from '../webview'
import { getAnthropicKey, getOpenaiKey } from './keys'
import { GlassSession, createSession, getSessionFilepath, loadGlass, writeGlass } from './session'

export interface GlassPlayground {
  filepath: string
  panel: vscode.WebviewPanel
  sessionId: string
}

export async function createPlayground(
  filepath: string,
  playgrounds: Map<string, GlassPlayground>,
  sessions: Map<string, GlassSession>,
  extensionUri: vscode.Uri,
  outputChannel: vscode.OutputChannel
) {
  const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filepath)
  if (!document) {
    return
  }
  const session = await createSession(filepath, sessions)
  if (!session) {
    return
  }
  const languageId = document.languageId
  const existingPlayground = playgrounds.get(filepath)
  if (existingPlayground) {
    existingPlayground.sessionId = session.id
    playgrounds.set(filepath, existingPlayground)
    const currentGlass = await loadGlass(session)
    const currentBlocks = parseGlassTranscriptBlocks(currentGlass)
    const currentMetadata =
      languageId === 'glass-py' ? await parseGlassMetadataPython(currentGlass) : parseGlassMetadata(currentGlass)
    await existingPlayground.panel.webview.postMessage({
      action: 'setGlass',
      data: {
        filename: filepath.split('/').pop(),
        session: existingPlayground.sessionId,
        glass: currentGlass,
        blocks: currentBlocks,
        variables: currentMetadata.interpolationVariables,
        source: currentGlass,
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
      viewColumn: vscode.ViewColumn.Beside,
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
        const stopSessionId = message.data.sessionDocument
        const playgroundToStop = playgrounds.get(filepath)
        if (!playgroundToStop || playgroundToStop.sessionId !== stopSessionId) {
          return
        }
        const stoppedGlass = message.data.glass.replace('█', '')
        const stoppedBlocks = parseGlassTranscriptBlocks(stoppedGlass)
        const stoppedMetadata =
          languageId === 'glass-py' ? await parseGlassMetadataPython(initialGlass) : parseGlassMetadata(stoppedGlass)
        await panel.webview.postMessage({
          action: 'onStream',
          data: {
            session: stopSessionId,
            glass: stoppedGlass,
            blocks: stoppedBlocks,
            variables: stoppedMetadata.interpolationVariables,
          },
        })
        break
      case 'getCurrentSession':
        const playgroundToLoad = playgrounds.get(filepath)
        if (!playgroundToLoad) {
          await vscode.window.showErrorMessage('No playground found')
          return
        }
        const currentSession = sessions.get(playgroundToLoad.sessionId)
        if (!currentSession) {
          await vscode.window.showErrorMessage('No current session')
          return
        }
        const currentGlass = await loadGlass(currentSession)
        const currentBlocks = parseGlassTranscriptBlocks(currentGlass)
        const currentMetadata =
          languageId === 'glass-py' ? await parseGlassMetadataPython(currentGlass) : parseGlassMetadata(currentGlass)
        await panel.webview.postMessage({
          action: 'setGlass',
          data: {
            filename: filepath.split('/').pop(),
            session: currentSession.id,
            glass: currentGlass,
            blocks: currentBlocks,
            variables: currentMetadata.interpolationVariables,
            currentSource: currentGlass,
            source: currentGlass,
          },
        })
        break
      case 'resetSession':
        const newSession = await createSession(filepath, sessions)
        if (!newSession) {
          await vscode.window.showErrorMessage('Unable to reset session')
          return
        }
        const playground = playgrounds.get(filepath)
        if (!playground) {
          await vscode.window.showErrorMessage('No playground found')
          return
        }
        playground.sessionId = newSession.id
        playgrounds.set(filepath, playground)
        const newGlass = await loadGlass(newSession)
        const newBlocks = parseGlassTranscriptBlocks(newGlass)
        const newMetadata =
          languageId === 'glass-py' ? await parseGlassMetadataPython(newGlass) : parseGlassMetadata(newGlass)
        await panel.webview.postMessage({
          action: 'setGlass',
          data: {
            session: newSession.id,
            glass: newGlass,
            blocks: newBlocks,
            variables: newMetadata.interpolationVariables,
            source: newGlass,
          },
        })
        break
      case 'openSessionFile':
        const sessionIdToOpen = message.data.session
        const sessionToOpen = sessions.get(sessionIdToOpen)
        if (!sessionToOpen) {
          await vscode.window.showErrorMessage('No session found')
          return
        }
        const sessionFilepath = getSessionFilepath(sessionToOpen)
        try {
          const newSessionFile = await vscode.workspace.openTextDocument(sessionFilepath)
          await vscode.window.showTextDocument(newSessionFile, {
            viewColumn: vscode.ViewColumn.Beside,
          })
        } catch {
          await vscode.window.showErrorMessage('Unable to open session file')
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
          const model =
            requestElement?.attrs?.find((attr: any) => attr.name === 'model')?.stringValue ??
            (vscode.workspace.getConfiguration('glass').get('defaultModel') as string)
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
            const resp = await executeGlassFile(
              origFilePath,
              outputChannel,
              sessionDocument,
              inputs,
              async ({ nextDoc }) => {
                const existingPlayground = playgrounds.get(filepath)
                if (!existingPlayground || sessionId !== existingPlayground.sessionId) {
                  return false
                }
                const session = sessions.get(existingPlayground.sessionId)
                if (!session || session.stopped) {
                  return false
                }
                writeGlass(session, nextDoc)
                const blocksForGlass = parseGlassTranscriptBlocks(nextDoc)
                const metadataForGlass =
                  languageId === 'glass-py' ? await parseGlassMetadataPython(nextDoc) : parseGlassMetadata(nextDoc)
                await panel.webview.postMessage({
                  action: 'onStream',
                  data: {
                    session: session.id,
                    blocks: blocksForGlass,
                    variables: metadataForGlass.interpolationVariables,
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
            if (!session || session.stopped) {
              return false
            }
            const blocksForGlass = parseGlassTranscriptBlocks(resp.finalDoc)
            const metadataForGlass =
              languageId === 'glass-py'
                ? await parseGlassMetadataPython(resp.finalDoc)
                : parseGlassMetadata(resp.finalDoc)
            writeGlass(session, resp.finalDoc)
            await panel.webview.postMessage({
              action: 'onResponse',
              data: {
                session: sessionId,
                glass: resp.finalDoc,
                blocks: blocksForGlass,
                variables: metadataForGlass.interpolationVariables,
                model,
                inputs,
                output: resp.rawResponse,
              },
            })
            if (resp.continued) {
              await runGlassExtension(resp.finalDoc, sessionId, inputs)
            }
          } catch (error) {
            console.error(error)
            void vscode.window.showErrorMessage(`ERROR: ${error}`)
          }
        }
        const sessionId = message.data.session
        const activeSession = sessions.get(sessionId)
        if (sessionId == null || !activeSession) {
          await vscode.window.showErrorMessage('No session provided')
          return
        }
        activeSession.stopped = false
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
