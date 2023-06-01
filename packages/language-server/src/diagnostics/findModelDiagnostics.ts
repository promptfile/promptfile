import { LANGUAGE_MODELS, LanguageModelCreator, LanguageModelType, parseGlassBlocks } from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findModelDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed = parseGlassBlocks(textDocument.getText())
    const requestElement = parsed.find(tag => tag.tag && ['Request'].includes(tag.tag))
    if (!requestElement) {
      return []
    }

    const modelAttribute = requestElement.attrs?.find(attr => attr.name === 'model')
    if (!modelAttribute || !modelAttribute.stringValue) {
      return []
    }

    const model = modelAttribute.stringValue
    const languageModel = LANGUAGE_MODELS.find(m => m.name === model)

    if (!languageModel) {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(requestElement.position.start.offset),
          end: textDocument.positionAt(requestElement.position.end.offset),
        },
        message: `Unknown model: ${model}`,
        source: 'glass',
      }
      return [diagnostic]
    }

    const diagnostics: Diagnostic[] = []
    const systemBlocks = parsed.filter(tag => tag.tag === 'System')
    const assistantBlocks = parsed.filter(tag => tag.tag === 'Assistant')
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
            source: 'glass',
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
            source: 'glass',
          }
          return diagnostic
        })
      )
    }

    switch (languageModel.type) {
      case LanguageModelType.completion:
        const multiplePromptBlocks = parsed.filter(tag => tag.tag === 'User')
        if (multiplePromptBlocks.length > 1) {
          diagnostics.push(
            ...multiplePromptBlocks.slice(1).map(tag => {
              const diagnostic: Diagnostic = {
                severity: DiagnosticSeverity.Error,
                range: {
                  start: textDocument.positionAt(tag.position.start.offset),
                  end: textDocument.positionAt(tag.position.end.offset),
                },
                message: `Only one <User> block allowed per file.`,
                source: 'glass',
              }
              return diagnostic
            })
          )
        }
        break

      default:
        break
    }
    return diagnostics
  } catch {
    return []
  }
}
