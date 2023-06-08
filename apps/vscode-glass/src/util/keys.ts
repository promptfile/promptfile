import * as vscode from 'vscode'

export function getOpenaiKey() {
  let openaiKey: string = vscode.workspace.getConfiguration('glass').get('openaiKey') as any
  if (!openaiKey) {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    openaiKey = process.env.OPENAI_API_KEY || ''
  }

  return openaiKey || null
}

export function getAnthropicKey() {
  let anthropicKey: string = vscode.workspace.getConfiguration('glass').get('anthropicKey') as any
  if (!anthropicKey) {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    anthropicKey = process.env.ANTHROPIC_API_KEY || ''
  }

  return anthropicKey || null
}

export function getGithubKey() {
  let githubKey: string = vscode.workspace.getConfiguration('glass').get('githubKey') as any
  if (!githubKey) {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    githubKey = process.env.GITHUB_API_KEY || ''
  }

  return githubKey || null
}
