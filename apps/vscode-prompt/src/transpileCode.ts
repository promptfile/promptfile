import { parseFrontmatterFromGlass, transpile } from '@glass-lang/glasslib'
import * as vscode from 'vscode'

export async function transpileCode(text: string) {
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

  try {
    const code = transpile(text, language, model)
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
