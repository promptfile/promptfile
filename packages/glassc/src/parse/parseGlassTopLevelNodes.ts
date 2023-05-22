import { DocumentNode, determineLineAndColumn } from '@glass-lang/glasslib'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

export function parseGlassTopLevelNodes(doc: string): DocumentNode[] {
  const jsxNodes = parseGlassTopLevelJsxElements(doc)

  const result: DocumentNode[] = []
  let prevEndOffset = 0

  for (const jsxNode of jsxNodes) {
    // If there's text before the JSX node, create a TextBlockNode for it
    if (jsxNode.position.start.offset > prevEndOffset) {
      const textBlock = doc.substring(prevEndOffset, jsxNode.position.start.offset)

      // Here you might need a separate function to determine line and column based on offset
      const startPosition = determineLineAndColumn(doc, prevEndOffset)
      const endPosition = determineLineAndColumn(doc, jsxNode.position.start.offset)

      result.push({
        type: 'text',
        value: textBlock,
        position: {
          start: startPosition,
          end: endPosition,
        },
      })
    }

    result.push(jsxNode)
    prevEndOffset = jsxNode.position.end.offset
  }

  // If there's text after the last JSX node, create a TextBlockNode for it
  if (prevEndOffset < doc.length) {
    const textBlock = doc.substring(prevEndOffset)

    // Here you might need a separate function to determine line and column based on offset
    const startPosition = determineLineAndColumn(doc, prevEndOffset)
    const endPosition = determineLineAndColumn(doc, doc.length)

    result.push({
      type: 'text',
      value: textBlock,
      position: {
        start: startPosition,
        end: endPosition,
      },
    })
  }

  return result
}
