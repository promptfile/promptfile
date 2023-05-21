import { parseGlassTopLevelJsxElements } from '@glass-lang/glassc'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { glassAttributes } from '../attributes'

export function findInvalidAttributes(textDocument: TextDocument): Diagnostic[] {
  try {
    const parsed: any[] = parseGlassTopLevelJsxElements(textDocument.getText())
    const invalidAttributes: { type: string; tag: any; attribute: string }[] = []
    for (const tag of parsed) {
      const existingAttributes = tag.attrs ?? []
      const validAttributes = glassAttributes[tag.tagName] ?? []
      const missingRequiredAttributes = validAttributes.filter(
        attribute =>
          attribute.optional !== true &&
          !existingAttributes.some((existingAttribute: any) => existingAttribute.name === attribute.name)
      )
      invalidAttributes.push(
        ...missingRequiredAttributes.map(attribute => ({ tag, attribute: attribute.name, type: 'missing' }))
      )
      for (const attribute of existingAttributes) {
        if (!validAttributes.some(validAttribute => validAttribute.name === attribute.name)) {
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
          item.type === 'unknown' ? `Unknown "${item.attribute}" attribute` : `Missing attribute: "${item.attribute}"`,
        source: 'glass',
      }
      return diagnostic
    })
  } catch {
    return []
  }
}
