import * as vscode from 'vscode'

export function isGlassFile(document: vscode.TextDocument) {
  return ['glass-ts', 'glass-js', 'glass-py'].includes(document.languageId)
}

export function hasGlassFileOpen(editor: vscode.TextEditor) {
  return isGlassFile(editor.document)
}

export function getDocumentFilename(document: vscode.TextDocument) {
  return document.fileName.split('/').pop()!
}

export async function getAllGlassFiles(): Promise<vscode.Uri[]> {
  const glassFilePattern = '**/*.glass'
  // const excludePattern = '**/.glasslog/**' // exclude any .glass files in .glasslog folder

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

  return await vscode.workspace.findFiles(glassFilePattern, excludePattern)
}
