import { rewriteImports } from '@glass-lang/glassc'
import * as crypto from 'crypto'
import fs from 'fs'
import * as os from 'os'
import path from 'path'
import * as vscode from 'vscode'
import { generateULID } from './ulid'

export function getSessionDirectoryPath(filepath: string): string {
  let baseDir: string
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filepath))

  if (workspaceFolder) {
    baseDir = workspaceFolder.uri.fsPath
  } else {
    baseDir = os.homedir()
  }
  const glasslogDir = path.join(baseDir, '.glasslog')

  // Create the .glasslog directory if it doesn't exist
  if (!fs.existsSync(glasslogDir)) {
    fs.mkdirSync(glasslogDir)
  }

  const relativePath = path.relative(baseDir, filepath)
  const hashedPath = crypto.createHash('md5').update(relativePath).digest('hex')
  const finalPath = path.join(glasslogDir, hashedPath)
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath)
  }
  return finalPath
}

export function getCurrentSessionFilepath(filepath: string): string | undefined {
  const sessionDirectory = getSessionDirectoryPath(filepath)
  const sessionFiles = fs.readdirSync(sessionDirectory).filter(file => file.endsWith('.glass'))
  const lastSessionFile = sessionFiles.length > 0 ? sessionFiles[sessionFiles.length - 1] : undefined
  if (!lastSessionFile) {
    return undefined
  }
  return path.join(sessionDirectory, lastSessionFile)
}

export function loadGlass(session: string) {
  console.log('loadGlass', session)
  const glass = fs.readFileSync(session, 'utf-8')
  return glass
}

export function writeGlass(session: string, glass: string) {
  fs.writeFileSync(session, glass)
  return session
}

export async function createSession(filepath: string): Promise<string> {
  console.log('createSession', filepath)
  const sessionDirectory = getSessionDirectoryPath(filepath)
  const sessionId = generateULID()
  console.log('sessionId', sessionId)
  const glass = fs.readFileSync(filepath, 'utf-8')
  const updatedGlass = rewriteImports(glass, sessionDirectory, filepath)
  const sessionPath = path.join(sessionDirectory, `${sessionId}.glass`)
  return writeGlass(sessionPath, updatedGlass)
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
