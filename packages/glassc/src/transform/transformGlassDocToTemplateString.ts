import { parseGlassTopLevelJsxElements } from '../parse/parseGlassTopLevelJsxElements'
import { transformJsxElementToTemplateString } from './transformJsxElementToTemplateString'

export function transformGlassDocumentToTemplateString(input: string): string {
  const jsxNodes = parseGlassTopLevelJsxElements(input)

  const replacementMap: Record<string, string> = {}

  let transformedDoc = input

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]
    const docSlice = input.slice(node.position.start.offset, node.position.end.offset)
    const replacement = transformJsxElementToTemplateString(docSlice)
    replacementMap[`!##GLASS-${i}`] = replacement
    transformedDoc = transformedDoc.replace(docSlice, `!##GLASS-${i}`)
  }

  for (const [key, value] of Object.entries(replacementMap)) {
    transformedDoc = transformedDoc.replace(key, value)
  }

  return transformedDoc
  // return transformedDoc.replace(/\$\{(.+?)\}/g, '\\${$1}')
}
