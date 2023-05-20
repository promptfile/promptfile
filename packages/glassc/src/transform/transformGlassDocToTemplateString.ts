import { parseGlassTopLevelJsxElements } from '../parse/parseGlassTopLevelJsxElements'
import { parsePythonUndeclaredSymbols } from '../parse/parsePython'
import { escapePythonTemplateSequences } from './escapePythonTemplateSequences'
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

export function transformGlassDocumentToTemplateStringPython(input: string) {
  const jsxNodes = parseGlassTopLevelJsxElements(input)

  const replacementMap: Record<string, string> = {}

  const undeclaredSymbols = new Set<string>()

  let transformedDoc = input

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]
    const docSlice = input.slice(node.position.start.offset, node.position.end.offset)

    const attrInterpolations: string[] = []
    for (const attr of node.attrs) {
      if (attr.expressionValue) {
        attrInterpolations.push(`${attr.expressionValue}`)
        for (const s of parsePythonUndeclaredSymbols(attr.expressionValue)) {
          undeclaredSymbols.add(s)
        }
      }
    }

    const insides =
      node.children.length === 0
        ? ''
        : input.substring(
            node.children[0].position.start.offset,
            node.children[node.children.length - 1].position.end.offset
          )
    const transformedInsides = transformGlassDocumentToTemplateStringPython(insides)
    for (const s of transformedInsides.undeclaredSymbols) {
      undeclaredSymbols.add(s)
    }

    const replacement = `"""<${node.tagName}${node.attrs
      .map(a => ` ${a.name}=${a.stringValue ? `"${a.stringValue}"` : `{{"{}"}}`}`)
      .join('')}>
{}
</${node.tagName}>""".format(${attrInterpolations.concat(transformedInsides.newDocument).join(', ')})`

    replacementMap[`!##GLASS-${i}`] = replacement
    transformedDoc = transformedDoc.replace(docSlice, `!##GLASS-${i}`)
  }

  // look inside the transformedDoc for any sequence like:
  // ${...} (allowing for whitespace / multiple lines), or
  // !##GLASS-[0-9]+
  //
  // replace all of these with a Python format argument {} and add the
  // corresponding value to the formatArgs array
  const regex = /\$\{(.+?)\}|!##GLASS-[0-9]+/gs
  let match: RegExpExecArray | null

  let finalDoc = transformedDoc
  const formatArgs: string[] = []

  while ((match = regex.exec(transformedDoc)) != null) {
    if (match[0].startsWith('${')) {
      formatArgs.push(match[1])
      for (const s of parsePythonUndeclaredSymbols(match[1])) {
        undeclaredSymbols.add(s)
      }
      // finalDoc = finalDoc.replace(match[0], `{${match[1]}}`)
    } else {
      formatArgs.push(replacementMap[match[0]])
      // finalDoc = finalDoc.replace(match[0], '{}')
    }
    finalDoc = finalDoc.replace(match[0], '{}')
  }

  const newDocument = `"""${escapePythonTemplateSequences(finalDoc)}""".format(${formatArgs.join(', ')})`

  return { newDocument, undeclaredSymbols: Array.from(undeclaredSymbols) }
}
