import { rewriteImports } from '@glass-lang/glassc'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { getNonce } from './isGlassFile'

export interface GlassSession {
  filepath: string
  id: string
  tempDir: string
  stopped: boolean
}

export function getSessionFilepath(session: GlassSession) {
  const sessionFilepath = path.join(session.tempDir, `${session.id}.glass`)
  return sessionFilepath
}
export function loadGlass(session: GlassSession) {
  const sessionFilepath = getSessionFilepath(session)
  const glass = fs.readFileSync(sessionFilepath, 'utf-8')
  return glass
}

export function writeGlass(session: GlassSession, glass: string) {
  const sessionFilepath = getSessionFilepath(session)
  const updatedGlass = rewriteImports(glass, session.tempDir, session.filepath)
  fs.writeFileSync(sessionFilepath, updatedGlass)
}

export async function createSession(
  filepath: string,
  sessions: Map<string, GlassSession>
): Promise<GlassSession | undefined> {
  const sessionId = getNonce()
  const launchFile = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filepath)
  const savedFileText = fs.readFileSync(filepath, 'utf-8')
  const glass = launchFile?.getText() ?? savedFileText

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filepath))
  if (!workspaceFolder) {
    await vscode.window.showErrorMessage('No workspace opened')
    return undefined
  }
  const tempDir = path.join(workspaceFolder.uri.fsPath, '.glasslog')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  const newFilePath = path.join(tempDir, `${sessionId}.glass`)
  const updatedGlass = rewriteImports(glass, tempDir, filepath)
  fs.writeFileSync(newFilePath, updatedGlass)

  const session: GlassSession = {
    id: sessionId,
    filepath,
    tempDir,
    stopped: false,
  }
  sessions.set(session.id, session)
  return session
}
