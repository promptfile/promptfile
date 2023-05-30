import { constructGlassOutputFilePython, getGlassExportName, transpileGlassFilePython } from '@glass-lang/glassc'
import { TranspilerOutput } from '@glass-lang/glasslib'
import * as child_process from 'child_process'
import fs from 'fs'
import path from 'path'
import * as vscode from 'vscode'
import { getDocumentFilename } from './util/isGlassFile'
import { getAnthropicKey, getOpenaiKey } from './util/keys'

export async function executeGlassPython(document: vscode.TextDocument, inputs: any): Promise<TranspilerOutput[]> {
  const fileName = getDocumentFilename(document)

  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
  if (!activeEditorWorkspaceFolder) {
    throw new Error('Could not find active editor workspace folder')
  }
  const outputDirectoryConfig: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any

  const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
  const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)

  const transpiledFunction = await transpileGlassFilePython(document.getText(), {
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

print(${getGlassExportName(fileName)}(${jsonToPython(inputs || {})}))`
  )
  // console.log(
  //   'code is',
  //   `${transpiledCode}

  // print(${getGlassExportName(fileName)}(${jsonToPython(interpolationArgs || {})}))`
  // )

  fs.writeFileSync(
    tmpFilePath,
    `${transpiledCode}

print(${getGlassExportName(fileName)}())`,
    {
      encoding: 'utf-8',
    }
  )

  const output = await executePythonScript(tmpFilePath)

  console.log('got python output', JSON.stringify({ output }))

  const c = JSON.parse(output)

  fs.unlinkSync(tmpFilePath)

  return [c]
}

function executePythonScript(filePath: string): Promise<string> {
  const pythonExecutable = vscode.workspace.getConfiguration('glass').get('pythonPath') || 'python3'
  const openaiKey = getOpenaiKey()
  const anthropicKey = getAnthropicKey()

  let env = ''
  if (openaiKey) {
    env += `OPENAI_API_KEY=${openaiKey} `
  }
  if (anthropicKey) {
    env += `ANTHROPIC_API_KEY=${anthropicKey} `
  }

  return new Promise((resolve, reject) => {
    child_process.exec(`${env} ${pythonExecutable} ${filePath}`, (error, stdout, stderr) => {
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
