import { parseFrontmatterFromGlass, rewriteImports } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseGlassBlocks,
  parseGlassBlocksRecursive,
} from '@glass-lang/glasslib'
import * as crypto from 'crypto'
import fs from 'fs'
import * as os from 'os'
import path from 'path'
import * as vscode from 'vscode'
import { executeGlassFile } from '../runGlassExtension'
import { getAnthropicKey, getOpenaiKey } from './keys'

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < 8; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

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

function addFrontmatter(glass: string, file: string, sessionId: string, timestamp: string | undefined) {
  return `---
file: ${file}
session: ${sessionId}
timestamp: ${timestamp ?? new Date().toISOString()}
---

${glass}`
}

export async function createSession(filepath: string): Promise<string> {
  const sessionDirectory = getSessionDirectoryPath(filepath)
  const filename = path.basename(filepath)
  const sessionId = getNonce()
  let glass = fs.readFileSync(filepath, 'utf-8')
  const blocks = parseGlassBlocks(glass)
  glass = blocks.map(block => block.content).join('\n\n\n')
  glass = addFrontmatter(glass, filename, sessionId, undefined)
  glass = rewriteImports(glass, sessionDirectory, filepath)
  const sessionPath = path.join(sessionDirectory, `${sessionId}.glass`)
  fs.writeFileSync(sessionPath, glass)
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

export async function runGlassExtension(document: vscode.TextDocument, outputChannel: vscode.OutputChannel) {
  const session = document.uri.fsPath
  const glass = fs.readFileSync(session, 'utf-8')
  const frontmatter = parseFrontmatterFromGlass(glass)
  const elements = parseGlassBlocksRecursive(glass)
  const requestElement = elements.find(element => element.tag === 'Request')
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

  try {
    const resp = await executeGlassFile(session, outputChannel, document, glass, {}, async progress => {
      const withFrontmatter = addFrontmatter(
        progress.nextGlassfile,
        frontmatter.file,
        frontmatter.session,
        frontmatter.timestamp
      )
      fs.writeFileSync(session, withFrontmatter)
      return true
    })
    const withFrontmatter = addFrontmatter(
      resp.nextGlassfile,
      frontmatter.file,
      frontmatter.session,
      frontmatter.timestamp
    )
    fs.writeFileSync(session, withFrontmatter)
    if (resp.continued) {
      await runGlassExtension(document, outputChannel)
    } else {
      const finalGlassfile = `${withFrontmatter}

<User>

</User>

<Request model="${model}" />`
      fs.writeFileSync(session, finalGlassfile)
      const lines = finalGlassfile.split('\n')
      const position = new vscode.Position(lines.length - 4, 0)
      const selection = new vscode.Selection(position, position)
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && activeEditor.document === document) {
        activeEditor.selection = selection
      }
    }
  } catch (error) {
    console.error(error)
    void vscode.window.showErrorMessage(`ERROR: ${error}`)
  }
}
