import { parseFrontmatterFromGlass, parseGlassMetadata, rewriteImports } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseGlassBlocks,
  parseGlassBlocksRecursive,
  parseGlassTranscriptBlocks,
  removeGlassFrontmatter,
} from '@glass-lang/glasslib'
import * as crypto from 'crypto'
import fs from 'fs'
import * as os from 'os'
import path from 'path'
import * as vscode from 'vscode'
import { executeGlassFile } from '../runGlassExtension'
import { getAnthropicKey, getOpenaiKey } from './keys'
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

function addFrontmatter(glass: string, file: string, sessionId: string, timestamp: string | undefined) {
  const glassWithoutFrontmatter = removeGlassFrontmatter(glass)
  const metadata = parseGlassMetadata(glassWithoutFrontmatter)
  const glassSections = [
    `---
file: ${file}
session: ${sessionId}
timestamp: ${timestamp ?? new Date().toISOString()}
---`,
  ]
  if (metadata.interpolationVariables.length > 0) {
    const blocks = parseGlassBlocksRecursive(glassWithoutFrontmatter)
    const testBlock = blocks.find(block => block.tag === 'Test')
    if (!testBlock) {
      glassSections.push(
        `<Test>
return [{
  ${metadata.interpolationVariables.map(variable => `${variable}: "${variable} test value"`).join(',\n')}
}]
</Test>`
      )
    }
  }
  glassSections.push(glassWithoutFrontmatter)
  return glassSections.join('\n\n\n')
}

export async function createSession(filepath: string): Promise<string> {
  const sessionDirectory = getSessionDirectoryPath(filepath)
  const filename = path.basename(filepath)
  const sessionId = generateULID()
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
  // set document to active if it isn't already
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor || activeEditor.document.uri.fsPath !== document.uri.fsPath) {
    await vscode.window.showTextDocument(document)
  }
  const session = document.uri.fsPath
  const glass = document.getText()
  const frontmatter = parseFrontmatterFromGlass(glass)
  if (!frontmatter) {
    await vscode.window.showErrorMessage('Unable to parse frontmatter from Glass file')
    return
  }
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
    let numBlocks = parseGlassTranscriptBlocks(glass).length
    const resp = await executeGlassFile(session, outputChannel, document, glass, {}, async progress => {
      const newBlocks = parseGlassTranscriptBlocks(progress.nextGlassfile)
      if (newBlocks.length > numBlocks) {
        numBlocks = newBlocks.length
        // make a document edit to update the document with progress.nextGlassfile
        const edit = new vscode.WorkspaceEdit()
        const range = new vscode.Range(0, 0, document.lineCount, 0)
        const withFrontmatter = addFrontmatter(
          progress.nextGlassfile,
          frontmatter.file,
          frontmatter.session,
          frontmatter.timestamp
        )
        edit.replace(document.uri, range, withFrontmatter)
        await vscode.workspace.applyEdit(edit)
        scrollToBottom(document)
        return true
      }

      const currentGlass = document.getText()
      const blocks = parseGlassTranscriptBlocks(currentGlass)
      const streamingBlock = blocks.find(block => (block.child?.content ?? '').includes('█'))
      if (!streamingBlock || !progress.response || !streamingBlock.child) {
        return false
      }
      const edit = new vscode.WorkspaceEdit()
      const range = new vscode.Range(
        document.positionAt(streamingBlock.child.position.start.offset),
        document.positionAt(streamingBlock.child.position.end.offset)
      )
      edit.replace(document.uri, range, progress.response)
      await vscode.workspace.applyEdit(edit)
      scrollToBottom(document)
      return true
    })
    if (!document.getText().includes('█')) {
      return
    }

    // remove the █ character via document
    const edit = new vscode.WorkspaceEdit()
    const location = document.getText().indexOf('█')
    edit.delete(document.uri, new vscode.Range(document.positionAt(location), document.positionAt(location + 1)))
    if (resp.continued) {
      await vscode.workspace.applyEdit(edit)
      scrollToBottom(document)
      await runGlassExtension(document, outputChannel)
    } else {
      const addToGlassfile = `


<User>

</User>


<Request model="${model}" />`
      // make a document edit to update the document with progress.nextGlassfile
      const range = new vscode.Range(0, 0, document.lineCount, 0)
      edit.insert(document.uri, range.end, addToGlassfile)
      await vscode.workspace.applyEdit(edit)
      scrollToBottom(document)
      const finalGlassfile = document.getText()
      const lines = finalGlassfile.split('\n')
      const position = new vscode.Position(lines.length - 5, 0)
      const selection = new vscode.Selection(position, position)
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor && activeEditor.document.uri.fsPath === document.uri.fsPath) {
        activeEditor.selection = selection
        activeEditor.revealRange(selection)
      }
    }
  } catch (error) {
    console.error(error)
    void vscode.window.showErrorMessage(`ERROR: ${error}`)
  }
}

function scrollToBottom(document: vscode.TextDocument) {
  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor && activeEditor.document === document) {
    const lastLine = document.lineCount - 1
    const lastCharacter = document.lineAt(lastLine).text.length
    const bottomPosition = new vscode.Position(lastLine, lastCharacter)
    activeEditor.revealRange(new vscode.Range(bottomPosition, bottomPosition), vscode.TextEditorRevealType.Default)
  }
}
