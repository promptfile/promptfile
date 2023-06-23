import {
  parseChatBlocks,
  parseFrontmatterFromGlass,
  parseGlassFunctions,
  parseGlassMetadata,
} from '@glass-lang/glasslib'
import * as vscode from 'vscode'
import { transpileToJavascript } from './transpileToJavascript'
import { transpileToPython } from './transpileToPython'
import { transpileToRuby } from './transpileToRuby'
import { transpileToTypescript } from './transpileToTypescript'

export async function transpile(text: string) {
  const transpilationLanguages = [
    {
      label: 'TypeScript',
      description: '.ts',
      action: 'typescript',
    },
    {
      label: 'Python',
      description: '.py',
      action: 'python',
    },
    {
      label: 'JavaScript',
      description: '.js',
      action: 'javascript',
    },
    {
      label: 'Ruby',
      description: '.rb',
      action: 'ruby',
    },
  ]
  const transpilationLanguage = await vscode.window.showQuickPick(transpilationLanguages, {
    placeHolder: `Select a language to transpile to`,
  })
  if (!transpilationLanguage) {
    return
  }
  const defaultModel = vscode.workspace.getConfiguration('glass').get('defaultModel') as string
  const frontmatter = parseFrontmatterFromGlass(text)
  const model = frontmatter?.model ?? defaultModel
  const language = transpilationLanguage.action
  const blocks = parseChatBlocks(text)
  const variables = parseGlassMetadata(text).interpolationVariables
  const functions = parseGlassFunctions(text)
  let code = ''
  try {
    if (language === 'typescript') {
      code = transpileToTypescript(blocks, variables, functions, model)
    } else if (language === 'javascript') {
      code = transpileToJavascript(blocks, variables, functions, model)
    } else if (language === 'python') {
      code = transpileToPython(blocks, variables, functions, model)
    } else if (language === 'ruby') {
      code = transpileToRuby(blocks, variables, functions, model)
    }
    if (code.length === 0) {
      throw new Error(`No code was generated for ${language}`)
    }
    const doc = await vscode.workspace.openTextDocument({
      language,
      content: code,
    })
    await vscode.window.showTextDocument(doc)
  } catch (error) {
    console.error(error)
    throw error
  }
}
