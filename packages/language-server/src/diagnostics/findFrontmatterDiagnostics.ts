import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  LanguageModelType,
  parseFrontmatterFromGlass,
  parseGlassBlocks,
} from '@glass-lang/glasslib'
import * as vscode from 'vscode'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'

export function findFrontmatterDiagnostics(textDocument: vscode.TextDocument): Diagnostic[] {
  const regex = /---\n([\s\S]*?)\n---/
  const match = regex.exec(textDocument.getText())
  if (!match) {
    return []
  }
  const text = textDocument.getText()
  const blocks = parseGlassBlocks(text)
  const range = {
    start: textDocument.positionAt(match.index),
    end: textDocument.positionAt(match.index + match[0].length),
  }
  const frontmatter = parseFrontmatterFromGlass(text) as any | null
  const diagnostics: Diagnostic[] = []
  if (frontmatter && frontmatter.model) {
    const languageModel = LANGUAGE_MODELS.find(m => m.name === frontmatter.model)
    if (!languageModel) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range,
        message: `Unsupported model: ${frontmatter.model}`,
        source: 'promptfile',
      })
    }
    if (!languageModel) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range,
        message: `Unknown model: ${frontmatter.model}`,
        source: 'promptfile',
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      if (languageModel.deprecatedOn) {
        const isDeprecated = today >= languageModel.deprecatedOn
        if (isDeprecated) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range,
            message: `${languageModel.name} was deprecated on ${languageModel.deprecatedOn} and is no longer supported.`,
            source: 'promptfile',
          })
        } else {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range,
            message: `${languageModel.name} will be deprecated on ${languageModel.deprecatedOn}.`,
            source: 'promptfile',
          })
        }
      }

      const systemBlocks = blocks.filter(tag => tag.tag === 'System')
      if (languageModel.creator === LanguageModelCreator.anthropic) {
        diagnostics.push(
          ...systemBlocks.map(tag => {
            const diagnostic: Diagnostic = {
              severity: DiagnosticSeverity.Warning,
              range: {
                start: textDocument.positionAt(tag.position.start.offset + 1),
                end: textDocument.positionAt(tag.position.start.offset + 7),
              },
              message: `<System> blocks not supported by Anthropic — this will get converted to a <User> block.`,
              source: 'promptfile',
            }
            return diagnostic
          })
        )
      }
      if (languageModel.type === LanguageModelType.completion) {
        diagnostics.push(
          ...systemBlocks.map(tag => {
            const diagnostic: Diagnostic = {
              severity: DiagnosticSeverity.Warning,
              range: {
                start: textDocument.positionAt(tag.position.start.offset + 1),
                end: textDocument.positionAt(tag.position.start.offset + 7),
              },
              message: `<System> blocks not supported by ${languageModel.name} — this will get converted to a <User> block.`,
              source: 'promptfile',
            }
            return diagnostic
          })
        )
      }
    }
  }

  return diagnostics
}
