import { transpileGlassNext, transpileGlassPython } from '@glass-lang/glassc'
import path from 'path'
import * as vscode from 'vscode'

export async function transpileCurrentFile(document: vscode.TextDocument) {
  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)!
  const outputDirectoryConfig: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any
  const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
  const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)

  const filePath = document.uri.fsPath

  try {
    const code =
      document.languageId === 'glass-py'
        ? await transpileGlassPython(filePath, filePath, 'python', path.join(path.dirname(filePath)))
        : transpileGlassNext(workspacePath, filePath, 'typescript', outDir)
    return code
  } catch (error) {
    console.error(error)
    throw error
  }
}
