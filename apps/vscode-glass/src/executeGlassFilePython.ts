import { constructGlassOutputFilePython, getGlassExportName, transpileGlassFilePython } from '@glass-lang/glassc'
import * as child_process from 'child_process'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { getDocumentFilename } from './util/isGlassFile'

export async function executeGlassFilePython(document: vscode.TextDocument, interpolationArgs: any) {
  const fileName = getDocumentFilename(document)

  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
  if (!activeEditorWorkspaceFolder) {
    throw new Error('Could not find active editor workspace folder')
  }
  const outputDirectoryConfig: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any

  const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
  const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)

  const transpiledFunction = transpileGlassFilePython(document.getText(), {
    workspaceFolder: workspacePath,
    folderPath: document.uri.fsPath.split('/').slice(0, -1).join('/'),
    fileName,
    language: 'python',
    outputDirectory: outDir,
  })
  const transpiledCode = constructGlassOutputFilePython([transpiledFunction])

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }
  const tmpFilePath = path.join(outDir, 'glass-tmp.py')

  console.log(
    'code is',
    `${transpiledCode}

  print(${getGlassExportName(fileName)}(${jsonToPython(interpolationArgs || {})}))`
  )

  fs.writeFileSync(
    tmpFilePath,
    `${transpiledCode}

print(${getGlassExportName(fileName)}(${jsonToPython(interpolationArgs || {})}))`,
    {
      encoding: 'utf-8',
    }
  )

  const output = await executePythonScript(tmpFilePath)

  fs.unlinkSync(tmpFilePath)

  return output
}

const pythonExecutable = vscode.workspace.getConfiguration('glass').get('pythonPath') || 'python3'

function executePythonScript(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.exec(`${pythonExecutable} ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`)
        return
      }
      if (stderr) {
        reject(`Error: ${stderr}`)
        return
      }

      // Resolve the promise with the stdout
      resolve(stdout)
    })
  })
}

export function jsonToPython(json: any): string {
  if (json === null) {
    return 'None'
  }

  if (typeof json === 'boolean') {
    return json ? 'True' : 'False'
  }

  if (typeof json === 'number') {
    return json.toString()
  }

  if (typeof json === 'string') {
    return `'${json}'`
  }

  if (Array.isArray(json)) {
    const items = json.map(item => jsonToPython(item)).join(', ')
    return `[${items}]`
  }

  if (typeof json === 'object') {
    const items = Object.entries(json)
      .map(([key, value]) => `'${key}': ${jsonToPython(value)}`)
      .join(', ')
    return `{${items}}`
  }

  throw new Error('Invalid JSON data')
}
