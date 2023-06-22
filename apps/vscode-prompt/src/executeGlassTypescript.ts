import {
  constructGlassOutputFileTypescript,
  getGlassExportName,
  parseFrontmatterFromGlass,
  transpileGlassFileTypescript,
} from '@glass-lang/glassc'
import { TranspilerOutput } from '@glass-lang/glasslib'
import * as esbuild from 'esbuild'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import { TextDecoder } from 'util'
import vm from 'vm'
import * as vscode from 'vscode'

export async function executeGlassTypescript(
  glassfilePath: string,
  outputChannel: vscode.OutputChannel,
  document: vscode.TextDocument,
  content: string, // may be fresher than document.getText() wtf
  fileName: string,
  inputs: any
): Promise<TranspilerOutput> {
  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
  if (!activeEditorWorkspaceFolder) {
    throw new Error('Could not find active editor workspace folder')
  }

  const outputDirectoryConfig: string = vscode.workspace.getConfiguration('prompt').get('outputDirectory') as any

  const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
  const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)
  const folderPath = document.uri.fsPath.split('/').slice(0, -1).join('/')

  const transpiledFunction = transpileGlassFileTypescript(content, {
    workspaceFolder: workspacePath,
    folderPath,
    fileName,
    language: 'typescript',
    outputDirectory: outDir,
  })
  const transpiledCode = constructGlassOutputFileTypescript([transpiledFunction])

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }
  const tmpFilePath = path.join(outDir, 'glass-tmp.ts')

  fs.writeFileSync(
    tmpFilePath,
    `${transpiledCode}
context.response = ${getGlassExportName(fileName)}(${JSON.stringify(inputs || {})})`,
    {
      encoding: 'utf-8',
    }
  )

  // bundle the code so that it can be executed in a vm with resolved imports
  let result: any = undefined
  try {
    result = await esbuild.build({
      entryPoints: [tmpFilePath],
      bundle: true,
      platform: 'node',
      sourcemap: 'inline',
      write: false,
      format: 'cjs',
      target: 'es2020',
      external: [],
    })
  } catch (e: any) {
    console.error(e)
    throw e
  }

  const bundledCode = new TextDecoder().decode(result.outputFiles[0].contents)

  fs.unlinkSync(tmpFilePath)

  const bundledCodeFilePath = path.join(folderPath, 'glass-bundle.js')

  fs.writeFileSync(bundledCodeFilePath, bundledCode, {
    encoding: 'utf-8',
  })

  const parsedFrontmater = parseFrontmatterFromGlass(content)

  const script = new vm.Script(bundledCode, { filename: 'outputFile.js' })
  const context: any = {}
  const ctx = {
    console: {
      log(...args: any[]) {
        console.log(args)
        outputChannel.appendLine(args.join(' '))
      },
    },
    context,
    global,
    process,
    module: { exports: {} },
    require: require,
    __filename: 'outputFile.js',
    // __dirname: folderPath,
    __dirname: parsedFrontmater?.file
      ? `${path.join(parsedFrontmater.file, '..')}`
      : `${path.join(glassfilePath, '..')}`,
    fetch,
  }
  vm.createContext(ctx)
  script.runInContext(ctx)

  return await context.response
}
