import * as vscode from 'vscode'

export function isPromptFile(document: vscode.TextDocument) {
  return document.languageId === 'prompt'
}

export function hasPromptFileOpen(editor: vscode.TextEditor) {
  return isPromptFile(editor.document)
}

export function getDocumentFilename(document: vscode.TextDocument) {
  return document.fileName.split('/').pop()!
}

export async function getAllPromptFiles(): Promise<vscode.Uri[]> {
  const glassFilePattern = '**/*.prompt'
  // const excludePattern = '**/.prompt-playgrounds/**' // exclude any .prompt files in .prompt-playgrounds folder

  const config = vscode.workspace.getConfiguration()

  // Get the current value of the `search.exclude` setting
  const searchExclude = config.get('search.exclude') as any

  let excludePattern = ''
  if (searchExclude) {
    const patterns = Object.keys(searchExclude)
      .filter(key => searchExclude[key]) // Get properties with true value
      .map(key => (key.endsWith('/**') ? key : key + '/**')) // Add '/**' to patterns if not exists
    excludePattern = patterns.join(',')
  }

  if (excludePattern) excludePattern += ','
  excludePattern += '**/.prompt-playgrounds/**' // exclude any .prompt files in .prompt-playgrounds folder

  // for some reason, the exclude pattern doesn't work, so we have to filter out the results
  return await vscode.workspace.findFiles(glassFilePattern, '**/.prompt-playgrounds/**')
}
