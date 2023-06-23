import { parseGlassBlocks } from '@glass-lang/glasslib'
import * as vscode from 'vscode'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { glassElements } from '../elements'

export function findUnsupportedTagsDiagnostics(textDocument: vscode.TextDocument): Diagnostic[] {
  const parsed = parseGlassBlocks(textDocument.getText())
  const unsupportedTags = parsed.filter(tag => !glassElements.some(element => element.name === tag.tag))
  return unsupportedTags.map(tag => {
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: textDocument.positionAt(tag.position.start.offset),
        end: textDocument.positionAt(tag.position.end.offset),
      },
      message: `Unsupported <${tag.tag}> tag.`,
      source: 'promptfile',
    }

    return diagnostic
  })
}
