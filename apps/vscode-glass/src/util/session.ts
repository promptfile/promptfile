import { parseFrontmatterFromGlass, parseGlassMetadata, rewriteImports } from '@glass-lang/glassc'
import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  parseGlassBlocks,
  parseGlassBlocksRecursive,
  removeGlassFrontmatter,
} from '@glass-lang/glasslib'
import fs from 'fs'
import * as os from 'os'
import path from 'path'
import * as vscode from 'vscode'
import { executeGlassFile } from '../runGlassExtension'
import { updateTextDocumentWithDiff } from './diffing'
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
  // get filename
  const filename = path.basename(filepath)
  const finalPath = path.join(glasslogDir, filename)
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

export async function createSession(filepath: string, glass: string): Promise<string> {
  const sessionDirectory = getSessionDirectoryPath(filepath)
  const filename = path.basename(filepath)
  const sessionId = generateULID()
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
  // if the cursor is not active in the document, activate it
  if (vscode.window.activeTextEditor?.document.uri.fsPath !== document.uri.fsPath) {
    const end = new vscode.Position(document.lineCount, 0)
    const selection = new vscode.Selection(end, end)
    await vscode.window.showTextDocument(document, { selection })
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
    let isUpdatingFile = false
    let didFinish = false
    let isFirstStream = true
    let finalResp: any | null = null

    // Create a new Promise that will resolve when all streaming updates have been processed
    const streamUpdatesDone = new Promise<void>(resolve => {
      executeGlassFile(session, outputChannel, document, glass, {}, async progress => {
        if (isUpdatingFile || didFinish) {
          return true
        }
        isUpdatingFile = true
        const newGlass = addFrontmatter(
          progress.nextGlassfile,
          frontmatter.file,
          frontmatter.session,
          frontmatter.timestamp
        )

        await updateTextDocumentWithDiff(document, newGlass)
        scrollToBottom(document, isFirstStream)
        isFirstStream = false
        isUpdatingFile = false
        return true
      })
        .then(resp => {
          didFinish = true
          finalResp = resp // Store the final response in a variable
          resolve() // Resolve the promise when all streaming updates have been processed
        })
        .catch(error => {
          // Handle error if needed, or just ignore
        })
    })

    // Await the Promise before updating the final text modification
    await streamUpdatesDone
    if (!finalResp) {
      return
    }
    const newGlass = addFrontmatter(
      finalResp.nextGlassfile,
      frontmatter.file,
      frontmatter.session,
      frontmatter.timestamp
    )
    await updateTextDocumentWithDiff(document, newGlass)

    if (finalResp.continued) {
      scrollToBottom(document)
      await runGlassExtension(document, outputChannel)
    } else {
      const addToGlassfile = `


<User>

</User>


      <Request model="${model}" />`
      // make a document edit to update the document with progress.nextGlassfile
      const range = new vscode.Range(0, 0, document.lineCount, 0)
      const edit = new vscode.WorkspaceEdit()
      edit.insert(document.uri, range.end, addToGlassfile)
      await vscode.workspace.applyEdit(edit)
      await document.save()
      const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === document.uri.fsPath)
      if (editor) {
        const finalGlassfile = document.getText()
        const lines = finalGlassfile.split('\n')
        const position = new vscode.Position(lines.length - 5, 0)
        const selection = new vscode.Selection(position, position)
        editor.selection = selection
        editor.revealRange(selection, vscode.TextEditorRevealType.Default)
      }
      scrollToBottom(document)
    }
  } catch (error) {
    console.error(error)
    void vscode.window.showErrorMessage(`ERROR: ${error}`)
  }
}

function scrollToBottom(document: vscode.TextDocument, force = false) {
  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor && activeEditor.document === document && (force || areLastNLinesVisible(activeEditor, 10))) {
    const lastLine = document.lineCount - 1
    const lastCharacter = document.lineAt(lastLine).text.length
    const bottomPosition = new vscode.Position(lastLine, lastCharacter)
    activeEditor.revealRange(new vscode.Range(bottomPosition, bottomPosition), vscode.TextEditorRevealType.Default)
  }
}

function areLastNLinesVisible(editor: vscode.TextEditor, n: number): boolean {
  // Get the last 'n' lines.
  const startLine = Math.max(0, editor.document.lineCount - n)
  const endLine = editor.document.lineCount - 1
  const lastNLinesRange = new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length)

  // Check each visible range to see if it intersects with the last 'n' lines.
  const visibleRanges = editor.visibleRanges
  for (const range of visibleRanges) {
    if (range.intersection(lastNLinesRange)) {
      return true
    }
  }
  return false
}
