import { rewriteImports } from '@glass-lang/glassc'
import * as crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { generateULID } from './ulid'

export interface GlassSession {
  filepath: string
  filename: string
  id: string
  tempDir: string
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
  const sessionId = generateULID()
  const launchFile = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filepath)
  const savedFileText = fs.readFileSync(filepath, 'utf-8')
  const glass = launchFile?.getText() ?? savedFileText

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filepath))
  if (!workspaceFolder) {
    await vscode.window.showErrorMessage('No workspace opened')
    return undefined
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, filepath)
  const hashedPath = crypto.createHash('md5').update(relativePath).digest('hex')
  const tempDir = path.join(workspaceFolder.uri.fsPath, '.glasslog', hashedPath)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const newFilePath = path.join(tempDir, `${sessionId}.glass`)
  const updatedGlass = rewriteImports(glass, tempDir, filepath)
  fs.writeFileSync(newFilePath, updatedGlass)

  const session: GlassSession = {
    id: sessionId,
    filepath,
    filename: path.basename(filepath),
    tempDir,
  }
  sessions.set(session.id, session)
  return session
}

export async function loadSessionDocuments(filepath: string): Promise<vscode.TextDocument[]> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filepath))
  if (!workspaceFolder) {
    return []
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, filepath)
  const hashedPath = crypto.createHash('md5').update(relativePath).digest('hex')
  const tempDir = path.join(workspaceFolder.uri.fsPath, '.glasslog', hashedPath)

  if (!fs.existsSync(tempDir)) {
    return []
  }

  const sessionFiles = fs.readdirSync(tempDir).filter(file => file.endsWith('.glass'))
  const sessionDocuments: vscode.TextDocument[] = []

  for (const sessionFile of sessionFiles) {
    const sessionFilePath = path.join(tempDir, sessionFile)
    try {
      const doc = await vscode.workspace.openTextDocument(sessionFilePath)
      sessionDocuments.push(doc)
    } catch (error) {
      console.error(`Failed to load session document: ${sessionFilePath}`, error)
    }
  }

  return sessionDocuments
}
