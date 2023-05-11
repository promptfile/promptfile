import { getGlassExportName, transpileGlass } from '@glass-lang/glassc'
import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { TextDecoder } from 'util'
import vm from 'vm'
import * as vscode from 'vscode'

export async function executeGlassFile(document: vscode.TextDocument, interpolationArgs: any) {
  const fileName = document.fileName

  const activeEditorWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)!
  const outputDirectoryConfig: string = vscode.workspace.getConfiguration('glass').get('outputDirectory') as any

  const workspacePath = activeEditorWorkspaceFolder.uri.fsPath
  const outDir = outputDirectoryConfig.replace('${workspaceFolder}', workspacePath)

  const transpiledCode = transpileGlass(workspacePath, document.uri.fsPath, 'typescript', outDir)

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }
  const tmpFilePath = path.join(outDir, 'glass-tmp.ts')

  fs.writeFileSync(
    tmpFilePath,
    `${transpiledCode}
context.response = ${getGlassExportName(fileName)}(${JSON.stringify(interpolationArgs)})`,
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
  })

  const bundledCode = new TextDecoder().decode(result.outputFiles[0].contents)

  fs.unlinkSync(tmpFilePath)

  const script = new vm.Script(bundledCode, { filename: 'outputFile.js' })

  const context: any = {}

  const ctx = {
    console,
    context,
    global,
    process,
    module: { exports: {} },
    require: require,
  }

  vm.createContext(ctx)
  script.runInContext(ctx)

  console.log('ctx response is after execution', context.response)
  return context.response
}
