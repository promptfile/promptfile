import { LANGUAGE_MODELS, LanguageModelCreator, LanguageModelType, parseGlassBlocks } from '@glass-lang/glasslib'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { glassElements } from './elements'

export function getDiagnostics(textDocument: TextDocument): Diagnostic[] {
  return [
    ...findUnmatchedTagsDiagnostics(textDocument),
    ...findUnsupportedTagsDiagnostics(textDocument),
    ...findAttributeDiagnostics(textDocument),
    ...findModelDiagnostics(textDocument),
    ...findRequestModelDiagnostics(textDocument),
    ...findEmptyBlocksDiagnostics(textDocument),
    // ...findFrontmatterDiagnostics(textDocument),
    ...findMultipleTranscriptDiagnostics(textDocument),
  ]
}

function findAttributeDiagnostics(textDocument: TextDocument): Diagnostic[] {
  // try {
  const parsed = parseGlassBlocks(textDocument.getText())
  const invalidAttributes: { type: string; tag: any; attribute: string }[] = []
  for (const tag of parsed) {
    const existingAttributes = tag.attrs ?? []
    const glassElement = glassElements.find(element => element.name === tag.tag)
    const validAttributes = glassElement?.attributes ?? []
    const missingRequiredAttributes = validAttributes.filter(
      attribute =>
        attribute.optional !== true &&
        !existingAttributes.some((existingAttribute: any) => existingAttribute.name === attribute.name)
    )
    invalidAttributes.push(
      ...missingRequiredAttributes.map(attribute => ({ tag, attribute: attribute.name, type: 'missing' }))
    )
    const analyzedAttributes: string[] = []
    for (const attribute of existingAttributes) {
      const validAttribute = validAttributes.find(validAttribute => validAttribute.name === attribute.name)
      if (validAttribute) {
        if (validAttribute.values && !validAttribute.values.some(a => a.name === attribute.stringValue)) {
          invalidAttributes.push({ tag, attribute: attribute.name, type: 'invalid' })
        }
        if (analyzedAttributes.includes(attribute.name)) {
          invalidAttributes.push({ tag, attribute: attribute.name, type: 'duplicate' })
        }
        analyzedAttributes.push(attribute.name)
      } else {
        invalidAttributes.push({ tag, attribute: attribute.name, type: 'unknown' })
      }
    }
  }
  return invalidAttributes.map(item => {
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: textDocument.positionAt(item.tag.position.start.offset),
        end: textDocument.positionAt(item.tag.position.end.offset),
      },
      message:
        item.type === 'duplicate'
          ? `Duplicate attribute: "${item.attribute}"`
          : item.type === 'unknown'
          ? `Unknown "${item.attribute}" attribute`
          : item.type === 'invalid'
          ? `Invalid value for attribute "${item.attribute}"`
          : `Missing attribute: "${item.attribute}"`,
      source: 'glass',
    }
    return diagnostic
  })
  // } catch {
  //   return []
  // }
}

function findEmptyBlocksDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed = parseGlassBlocks(textDocument.getText())
    const tagsToCheck = glassElements.filter(e => e.closingType === 'nonSelfClosing').map(e => e.name)
    const emptyTags = parsed.filter(tag => tagsToCheck.includes(tag.tag || '') && tag.child?.content === '')
    return emptyTags.map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `Empty <${tag.tag}> tag.`,
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}

// function findFrontmatterDiagnostics(textDocument: TextDocument): Diagnostic[] {
//   try {
//     // get the range of the frontmatter
//     const regex = /---\n([\s\S]*?)\n---/
//     const match = regex.exec(textDocument.getText())
//     if (!match) {
//       return []
//     }
//     const range = {
//       start: textDocument.positionAt(match.index),
//       end: textDocument.positionAt(match.index + match[0].length),
//     }
//     const frontmatter = parseFrontmatterFromGlass(textDocument.getText()) as any | null
//     const diagnostics: Diagnostic[] = []
//     if (frontmatter) {
//       if (frontmatter.language && !['python', 'javascript', 'typescript'].includes(frontmatter.language)) {
//         diagnostics.push({
//           severity: DiagnosticSeverity.Error,
//           range,
//           message: `Unsupported language: ${frontmatter.language}`,
//           source: 'glass',
//         })
//       }
//     }
//     return diagnostics
//   } catch {
//     return []
//   }
// }

function findRequestModelDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed = parseGlassBlocks(textDocument.getText())
    const requestElement = parsed.find(tag => tag.tag && ['Request'].includes(tag.tag))
    if (!requestElement) {
      return []
    }

    const maxTokensAttribute = requestElement.attrs?.find(attr => attr.name === 'maxTokens')

    const modelAttribute = requestElement.attrs?.find(attr => attr.name === 'model')

    if (!modelAttribute || !modelAttribute.stringValue) {
      return []
    }

    const model = modelAttribute.stringValue
    const languageModel = LANGUAGE_MODELS.find(m => m.name === model)

    if (!languageModel) {
      return []
    }

    const diagnostics: Diagnostic[] = []

    if (
      maxTokensAttribute &&
      maxTokensAttribute.expressionValue != null &&
      parseInt(maxTokensAttribute.expressionValue) > languageModel.maxTokens
    ) {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(requestElement.position.start.offset),
          end: textDocument.positionAt(requestElement.position.end.offset),
        },
        message: `maxTokens exceeds maximum value for ${languageModel.name}: ${languageModel.maxTokens}`,
        source: 'glass',
      }
      diagnostics.push(diagnostic)
    }

    // Add more diagnostics for temperature and other attributes here if needed

    return diagnostics
  } catch {
    return []
  }
}

function findModelDiagnostics(textDocument: TextDocument): Diagnostic[] {
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

    const today = new Date().toISOString().split('T')[0]
    if (languageModel.deprecatedOn) {
      const isDeprecated = today >= languageModel.deprecatedOn
      if (isDeprecated) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: textDocument.positionAt(requestElement.position.start.offset),
            end: textDocument.positionAt(requestElement.position.end.offset),
          },
          message: `${languageModel.name} was deprecated on ${languageModel.deprecatedOn} and is no longer supported.`,
          source: 'glass',
        })
      } else {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: textDocument.positionAt(requestElement.position.start.offset),
            end: textDocument.positionAt(requestElement.position.end.offset),
          },
          message: `${languageModel.name} will be deprecated on ${languageModel.deprecatedOn}.`,
          source: 'glass',
        })
      }
    }

    const systemBlocks = parsed.filter(tag => tag.tag === 'System')
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

    return diagnostics
  } catch {
    return []
  }
}

function findMultipleTranscriptDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed = parseGlassBlocks(textDocument.getText())
    const transcriptTags = parsed.filter(tag => tag.tag === 'Transcript')
    if (transcriptTags.length < 2) {
      return []
    }
    return transcriptTags.map(tag => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(tag.position.start.offset),
          end: textDocument.positionAt(tag.position.end.offset),
        },
        message: `Duplicate <${tag.tag}> tags — only one per file.`,
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}

function findUnmatchedTagsDiagnostics(textDocument: TextDocument): Diagnostic[] {
  const unmatchedTags = extractUnmatchedTags(textDocument.getText())
  return unmatchedTags.map(({ tag, start }) => {
    const tagName = tag.startsWith('/') ? tag.slice(1) : tag
    const range = {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(start + tagName.length + (tag.startsWith('/') ? 3 : 2)),
    }
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range,
      message: `<${tagName}> tag requires a closing </${tagName}> tag.`,
      source: 'glass',
    }

    return diagnostic
  })
}

export function extractUnmatchedTags(text: string) {
  const nonSelfClosingTags = glassElements
    .filter(e => e.closingType === 'nonSelfClosing')
    .map(e => e.name)
    .join('|')
  const tagPattern = new RegExp(`^<\/?(${nonSelfClosingTags})(\\s+[^>]*)?>`, 'gm')
  const tagStack: { tag: string; start: number }[] = []
  const unmatchedTags: { tag: string; start: number }[] = []

  let match
  while ((match = tagPattern.exec(text))) {
    const isOpeningTag = match[0][1] !== '/'
    const tag = match[1]

    if (isOpeningTag) {
      tagStack.push({ tag, start: match.index })
    } else {
      const lastOpeningTag = tagStack.pop()
      if (!lastOpeningTag || lastOpeningTag.tag !== tag) {
        if (lastOpeningTag) {
          unmatchedTags.push(lastOpeningTag)
          tagStack.push(lastOpeningTag)
        }
        unmatchedTags.push({ tag: `/${tag}`, start: match.index })
      }
    }
  }

  // Add any remaining unmatched opening tags
  unmatchedTags.push(...tagStack)
  return unmatchedTags
}

function findUnsupportedTagsDiagnostics(textDocument: TextDocument): Diagnostic[] {
  try {
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
        source: 'glass',
      }

      return diagnostic
    })
  } catch {
    return []
  }
}
