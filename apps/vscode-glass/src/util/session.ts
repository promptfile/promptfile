import { rewriteImports } from '@glass-lang/glassc'
import * as crypto from 'crypto'
import fs from 'fs'
import * as os from 'os'
import path from 'path'
import * as vscode from 'vscode'
import { generateULID } from './ulid'

export function getSessionId(sessionFilepath: string | undefined): string | undefined {
  return sessionFilepath?.split('/')?.pop()?.replace('.glass', '')
}

export function getSessionDirectoryPath(filepath: string): string {
  let baseDir: string
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filepath))

  if (workspaceFolder) {
    baseDir = workspaceFolder.uri.fsPath
  } else {
    // Use the home directory if no workspace is open
    baseDir = os.homedir()
    const glasslogDir = path.join(baseDir, '.glasslog')

    // Create the .glasslog directory if it doesn't exist
    if (!fs.existsSync(glasslogDir)) {
      fs.mkdirSync(glasslogDir)
    }
  }

  const relativePath = path.relative(baseDir, filepath)
  const hashedPath = crypto.createHash('md5').update(relativePath).digest('hex')
  return path.join(baseDir, '.glasslog', hashedPath)
}

export function getCurrentSessionFilepath(filepath: string): string | undefined {
  const sessionDirectory = getSessionDirectoryPath(filepath)
  const sessionFiles = fs.readdirSync(sessionDirectory).filter(file => file.endsWith('.glass'))
  return sessionFiles.length > 0 ? sessionFiles[sessionFiles.length - 1] : undefined
}

export function loadGlass(sessionId: string, filepath: string) {
  const sessionDirectoryPath = getSessionDirectoryPath(filepath)
  const sessionPath = path.join(sessionDirectoryPath, `${sessionId}.glass`)
  const glass = fs.readFileSync(sessionPath, 'utf-8')
  return glass
}

export function writeGlass(sessionId: string, filepath: string, glass: string) {
  const sessionDirectoryPath = getSessionDirectoryPath(filepath)
  const sessionPath = path.join(sessionDirectoryPath, `${sessionId}.glass`)
  const updatedGlass = rewriteImports(glass, sessionDirectoryPath, filepath)
  fs.writeFileSync(sessionPath, updatedGlass)
  return sessionPath
}

export async function createSession(filepath: string): Promise<string> {
  const sessionId = generateULID()
  const glass = fs.readFileSync(filepath, 'utf-8')
  const sessionPath = writeGlass(sessionId, filepath, glass)
  return sessionPath
}

export async function loadSessionDocuments(filepath: string): Promise<vscode.TextDocument[]> {
  const tempDir = getSessionDirectoryPath(filepath)

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
