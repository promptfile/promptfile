import * as vscode from 'vscode'

export function getOpenaiKey() {
  let openaiKey: string = vscode.workspace.getConfiguration('glass').get('openaiKey') as any
  if (!openaiKey) {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    openaiKey = process.env.OPENAI_KEY || ''
  }

  return openaiKey || null
}
