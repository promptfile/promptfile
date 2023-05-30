import {
  LANGUAGE_MODELS,
  LanguageModelCreator,
  LanguageModelType,
  parseGlassTopLevelJsxElements,
} from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function findModelDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed = parseGlassTopLevelJsxElements(textDocument.getText())
    const requestElement = parsed.find(tag => tag.tagName && ['Request', 'Chat'].includes(tag.tagName))
    if (!requestElement) {
      return []
    }

    const modelAttribute = requestElement.attrs.find(attr => attr.name === 'model')
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

    if (languageModel.creator === LanguageModelCreator.anthropic) {
      const systemBlocks = parsed.filter(tag => tag.tagName === 'System')
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

    switch (languageModel.type) {
      case LanguageModelType.chat:
        const promptBlocks = parsed.filter(tag => tag.tagName === 'Prompt')
        diagnostics.push(
          ...promptBlocks.map(tag => {
            const diagnostic: Diagnostic = {
              severity: DiagnosticSeverity.Error,
              range: {
                start: textDocument.positionAt(tag.position.start.offset),
                end: textDocument.positionAt(tag.position.end.offset),
              },
              message: `<Prompt> blocks not allowed with chat models.`,
              source: 'glass',
            }
            return diagnostic
          })
        )
        break
      case LanguageModelType.completion:
        const multiplePromptBlocks = parsed.filter(tag => tag.tagName === 'Prompt')
        if (multiplePromptBlocks.length > 1) {
          diagnostics.push(
            ...multiplePromptBlocks.slice(1).map(tag => {
              const diagnostic: Diagnostic = {
                severity: DiagnosticSeverity.Error,
                range: {
                  start: textDocument.positionAt(tag.position.start.offset),
                  end: textDocument.positionAt(tag.position.end.offset),
                },
                message: `Only one <Prompt> block allowed per file.`,
                source: 'glass',
              }
              return diagnostic
            })
          )
        }
        const chatBlocks = parsed.filter(tag => ['System', 'User', 'Assistant', 'Block'].includes(tag.tagName ?? ''))
        diagnostics.push(
          ...chatBlocks.map(tag => {
            const diagnostic: Diagnostic = {
              severity: DiagnosticSeverity.Warning,
              range: {
                start: textDocument.positionAt(tag.position.start.offset + 1),
                end: textDocument.positionAt(tag.position.start.offset + (tag.tagName ?? '').length + 1),
              },
              message: `Chat blocks not natively supported by completion model ${languageModel.name}.`,
              source: 'glass',
            }
            return diagnostic
          })
        )
        break

      default:
        break
    }
    return diagnostics
  } catch {
    return []
  }
}
