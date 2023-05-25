import { JSXNode } from './ast'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

export interface Node {
  tagName?: string
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

export function parseGlassTopLevelNodesNext(mdxDoc: string): Node[] {
  const jsxNodes: JSXNode[] = parseGlassTopLevelJsxElements(mdxDoc)
  const allNodes: Node[] = []
  let lastOffset = 0

  jsxNodes.forEach((jsxNode, i) => {
    // Add non-JSX content node
    if (jsxNode.position.start.offset > lastOffset) {
      allNodes.push({
        position: {
          start: {
            line: lineCounter(mdxDoc, lastOffset),
            column: columnCounter(mdxDoc, lastOffset),
            offset: lastOffset,
          },
          end: {
            line: lineCounter(mdxDoc, jsxNode.position.start.offset),
            column: columnCounter(mdxDoc, jsxNode.position.start.offset),
            offset: jsxNode.position.start.offset,
          },
        },
      })
    }

    // Add JSX node
    allNodes.push(jsxNode)

    // Update last offset
    lastOffset = jsxNode.position.end.offset
  })

  // Add trailing content node
  if (mdxDoc.length > lastOffset) {
    allNodes.push({
      position: {
        start: { line: lineCounter(mdxDoc, lastOffset), column: columnCounter(mdxDoc, lastOffset), offset: lastOffset },
        end: {
          line: lineCounter(mdxDoc, mdxDoc.length),
          column: columnCounter(mdxDoc, mdxDoc.length),
          offset: mdxDoc.length,
        },
      },
    })
  }

  return allNodes
}

// export function parseGlassTopLevelNodesNext(mdxDoc: string): Node[] {
//   const jsxNodes: JSXNode[] = parseGlassTopLevelJsxElements(mdxDoc)
//   const allNodes: Node[] = []
//   let lastOffset = 0

//   jsxNodes.forEach((jsxNode, i) => {
//     const nonJsxText = mdxDoc.slice(lastOffset, jsxNode.position.start.offset)
//     const start = lastOffset
//     const end = jsxNode.position.start.offset

//     if (nonJsxText.trim() !== '') {
//       allNodes.push({
//         position: {
//           start: { line: lineCounter(mdxDoc, start), column: columnCounter(mdxDoc, start), offset: start },
//           end: { line: lineCounter(mdxDoc, end), column: columnCounter(mdxDoc, end), offset: end },
//         },
//       })
//     }

//     allNodes.push(jsxNode)
//     lastOffset = jsxNode.position.end.offset
//   })

//   const trailingContent = mdxDoc.slice(lastOffset)
//   if (trailingContent.trim() !== '') {
//     allNodes.push({
//       position: {
//         start: { line: lineCounter(mdxDoc, lastOffset), column: columnCounter(mdxDoc, lastOffset), offset: lastOffset },
//         end: {
//           line: lineCounter(mdxDoc, mdxDoc.length),
//           column: columnCounter(mdxDoc, mdxDoc.length),
//           offset: mdxDoc.length,
//         },
//       },
//     })
//   }

//   return allNodes
// }

// export function parseGlassTopLevelNodesNext(mdxDoc: string): Node[] {
//   const jsxNodes: JSXNode[] = parseGlassTopLevelJsxElements(mdxDoc)
//   const allNodes: Node[] = []
//   let lastOffset = 0

//   jsxNodes.forEach((jsxNode, i) => {
//     const nonJsxText = mdxDoc.slice(lastOffset, jsxNode.position.start.offset)
//     const start = lastOffset
//     const end = jsxNode.position.start.offset

//     allNodes.push({
//       position: {
//         start: { line: lineCounter(mdxDoc, start), column: columnCounter(mdxDoc, start), offset: start },
//         end: { line: lineCounter(mdxDoc, end), column: columnCounter(mdxDoc, end), offset: end },
//       },
//     })

//     allNodes.push(jsxNode)
//     lastOffset = jsxNode.position.end.offset
//   })

//   const trailingContent = mdxDoc.slice(lastOffset)
//   allNodes.push({
//     position: {
//       start: { line: lineCounter(mdxDoc, lastOffset), column: columnCounter(mdxDoc, lastOffset), offset: lastOffset },
//       end: {
//         line: lineCounter(mdxDoc, mdxDoc.length),
//         column: columnCounter(mdxDoc, mdxDoc.length),
//         offset: mdxDoc.length,
//       },
//     },
//   })

//   return allNodes
// }

function lineCounter(doc: string, offset: number): number {
  return doc.slice(0, offset).split('\n').length
}

function columnCounter(doc: string, offset: number): number {
  const lines = doc.slice(0, offset).split('\n')
  return lines[lines.length - 1].length
}

export function reconstructDocFromNodes(nodes: Node[], doc: string): string {
  let reconstructedDoc = ''

  nodes.forEach(node => {
    const nodeText = doc.slice(node.position.start.offset, node.position.end.offset)
    reconstructedDoc += nodeText
  })

  return reconstructedDoc
}

export function addNodeToDocument(nodeText: string, atIndex: number, doc: string): string {
  const nodes: Node[] = parseGlassTopLevelNodesNext(doc)

  // Check if atIndex is within the valid range
  if (atIndex < 0 || atIndex > nodes.length) {
    throw new Error(`Invalid index ${atIndex}. It should be between 0 and ${nodes.length}.`)
  }

  let updatedDoc = ''
  let lastOffset = 0

  nodes.forEach((node, i) => {
    // If we are at the insertion index, add the new node text first
    if (i === atIndex) {
      updatedDoc += nodeText + '\n'
    }

    const currentNodeText = doc.slice(lastOffset, node.position.end.offset)
    updatedDoc += currentNodeText
    lastOffset = node.position.end.offset
  })

  // If we are inserting at the end, add the new node text after iterating over all nodes
  if (atIndex === nodes.length) {
    updatedDoc += '\n' + nodeText
  }

  return updatedDoc
}

export function replaceDocumentNode(nodeText: string, atIndex: number, doc: string): string {
  const nodes: Node[] = parseGlassTopLevelNodesNext(doc)

  // Check if atIndex is within the valid range
  if (atIndex < 0 || atIndex >= nodes.length) {
    throw new Error(`Invalid index ${atIndex}. It should be between 0 and ${nodes.length - 1}.`)
  }

  let updatedDoc = ''
  let lastOffset = 0

  nodes.forEach((node, i) => {
    let currentNodeText
    if (i === atIndex) {
      currentNodeText = nodeText
      // Add a newline unless this is the last node or the next node starts with a newline
      if (
        !currentNodeText.endsWith('\n') &&
        i < nodes.length - 1 &&
        !doc.startsWith('\n', nodes[i + 1].position.start.offset)
      ) {
        currentNodeText += '\n'
      }
    } else {
      currentNodeText = doc.slice(lastOffset, node.position.end.offset)
    }

    updatedDoc += currentNodeText
    lastOffset = node.position.end.offset
  })

  const trailingContent = doc.slice(lastOffset)
  updatedDoc += trailingContent

  return updatedDoc
}
