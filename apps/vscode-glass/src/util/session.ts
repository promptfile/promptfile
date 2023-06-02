import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { getNonce } from './isGlassFile'

export interface GlassSession {
  id: string
  filepath: string
  tempDir: string
  playground: vscode.WebviewPanel
  stopped: boolean
}

export function isCurrentSession(filepath: string, sessionId: string, sessions: Map<string, GlassSession>) {
  const session = sessions.get(filepath)
  if (!session) {
    return false
  }
  return session.id === sessionId
}

export async function resetCurrentSession(
  filepath: string,
  sessions: Map<string, GlassSession>
): Promise<GlassSession | undefined> {
  const existingSession = sessions.get(filepath)
  if (!existingSession) {
    return undefined
  }
  const launchFile = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filepath)
  const savedFileText = fs.readFileSync(filepath, 'utf-8')
  const glass = launchFile?.getText() ?? savedFileText
  const sessionId = getNonce()
  const tempDir = path.dirname(existingSession.tempDir)
  const newFilePath = path.join(tempDir, existingSession.id)
  fs.writeFileSync(newFilePath, glass)
  const session: GlassSession = {
    id: sessionId,
    filepath,
    tempDir: tempDir,
    playground: existingSession.playground,
    stopped: false,
  }
  sessions.set(filepath, session)
  return session
}

export async function createSession(playground: vscode.WebviewPanel, sessions: Map<string, GlassSession>) {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    await vscode.window.showErrorMessage('No active editor')
    return undefined
  }
  // Get the current workspace root where the file is located
  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)
  if (!activeEditorWorkspaceFolder) {
    await vscode.window.showErrorMessage('No workspace opened')
    return undefined
  }
  const sessionId = getNonce()
  const currentPath = activeEditor.document.uri.fsPath
  const tempDir = path.join(activeEditorWorkspaceFolder.uri.fsPath, '.glasslog')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  const newFilePath = path.join(tempDir, sessionId)
  fs.writeFileSync(newFilePath, activeEditor.document.getText())
  const session: GlassSession = {
    id: sessionId,
    filepath: currentPath,
    tempDir,
    playground,
    stopped: false,
  }
  sessions.set(currentPath, session)
  return session
}
