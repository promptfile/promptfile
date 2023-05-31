import { constructGlassOutputFileNext, getGlassExportName, transpileGlassFileNext } from '@glass-lang/glassc'
import { spawn } from 'child_process'
import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { TextDecoder } from 'util'
import * as vscode from 'vscode'

export async function executeGlassTypescriptNew(
  document: vscode.TextDocument,
  fileName: string,
  inputs: any,
  progress?: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => void
): Promise<{
  rawResponse: string
  codeResponse?: any
  initDoc: string
  initInterpolatedDoc: string
  finalDoc: string
  finalInterpolatedDoc: string
  continued: boolean
  setText: string | null
  setNextUserText: string | null
}> {
  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
  if (!activeEditorWorkspaceFolder) {
    throw new Error('Could not find active editor workspace folder')
  }

  const outputDirectoryConfig: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any

  const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
  const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)
  const folderPath = document.uri.fsPath.split('/').slice(0, -1).join('/')

  const transpiledFunction = transpileGlassFileNext(document.getText(), {
    workspaceFolder: workspacePath,
    folderPath,
    fileName,
    language: 'typescript',
    outputDirectory: outDir,
  })
  const transpiledCode = constructGlassOutputFileNext([transpiledFunction])

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }
  const tmpFilePath = path.join(outDir, 'glass-tmp.ts')

  fs.writeFileSync(
    tmpFilePath,
    `${transpiledCode}
const { getTestData, compile } = ${getGlassExportName(fileName)}()

;(async function run() {
  const t = getTestData()
  const res: any[] = []
  if (Array.isArray(t)) {
    for (const args of t) {
      const c: any = await compile({ args: { ...args, ...(${JSON.stringify(inputs || {})}) } })
      res.push(c)
    }
  } else {
    const c: any = await compile({ args: { ...t, ...(${JSON.stringify(inputs || {})}) } })
    res.push(c)
  }
  const ret = await runGlass(res[0], { progress: (data: { nextDoc: string; nextInterpolatedDoc: string; rawResponse?: string }) => {
    console.log('glass-progress: ' + JSON.stringify(data))
  } })
  console.log('glass-result: ' +  JSON.stringify(ret))
})()
`,
    {
      encoding: 'utf-8',
    }
  )

  // bundle the code so that it can be executed in a vm with resolved imports
  const result = await esbuild.build({
    entryPoints: [tmpFilePath],
    bundle: true,
    platform: 'node',
    write: false,
    format: 'cjs',
    target: 'es2020',
    external: ['@glass-lang/glasslib', 'hnswlib-node', 'openai'],
  })

  const bundledCode = new TextDecoder().decode(result.outputFiles[0].contents)

  fs.unlinkSync(tmpFilePath)

  const bundledCodeFilePath = path.join(folderPath, 'glass-bundle.js')

  fs.writeFileSync(bundledCodeFilePath, bundledCode, {
    encoding: 'utf-8',
  })

  return new Promise((resolve, reject) => {
    const p = spawn('node', [bundledCodeFilePath], {
      env: process.env,
    })

    let data = ''
    let error = ''

    let buffer = ''

    p.stdout.on('data', chunk => {
      buffer += chunk.toString()

      let lineEndIndex = buffer.indexOf('\n')
      while (lineEndIndex !== -1) {
        const line = buffer.substring(0, lineEndIndex)
        console.log(line.substring(0, 10))
        if (line.startsWith('glass-progress: ')) {
          try {
            const progressData = JSON.parse(line.slice('glass-progress: '.length))
            progress?.(progressData)
          } catch (e: any) {
            console.error('failed parsing progress line', line, e)
          }
        } else {
          console.log(line)
        }

        data += line + '\n'

        buffer = buffer.substring(lineEndIndex + 1)
        lineEndIndex = buffer.indexOf('\n')
      }
    })

    p.stderr.on('data', chunk => {
      error += chunk.toString()
    })

    p.on('exit', code => {
      // fs.unlinkSync(bundledCodeFilePath)

      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${error}`))
      } else {
        const lines = data.split('\n').filter(l => Boolean(l))
        const lastLine = lines[lines.length - 1]
        if (lastLine.startsWith('glass-result: ')) {
          resolve(JSON.parse(lastLine.slice('glass-result: '.length)))
        } else {
          reject(new Error(`Unexpected output: ${data}`))
        }
      }
    })
  })
}
