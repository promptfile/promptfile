export interface TextBlockNode {
  type: 'text'
  value: string
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

export interface JSXNode {
  tagName?: string
  value?: string
  type?: string
  attrs: { name: string; stringValue?: string; expressionValue?: string }[]
  children: JSXNode[]
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

export type DocumentNode = JSXNode | TextBlockNode

export interface Position {
  line: number
  column: number
  offset: number
}

export function determineLineAndColumn(doc: string, offset: number): Position {
  // In JavaScript, the first line and column are both 1
  let line = 1
  let column = 1

  for (let i = 0; i < offset; i++) {
    switch (doc[i]) {
      case '\n': // newline
        line++
        column = 1
        break
      case '\r': // carriage return
        if (doc[i + 1] === '\n') {
          // skip newline following carriage return
          i++
        }
        line++
        column = 1
        break
      default:
        column++
        break
    }
  }

  return {
    line,
    column,
    offset,
  }
}

export function documentNodesToAst(nodes: DocumentNode[], originalDoc: string): string {
  let fullText = ''

  for (const node of nodes) {
    const start = node.position.start.offset
    const end = node.position.end.offset
    fullText += originalDoc.slice(start, end)
  }

  return fullText
}

export function updateDocumentAst(
  nodes: DocumentNode[],
  originalDoc: string,
  nodeIndex: number,
  replacement: string
): { newNodes: DocumentNode[]; newDoc: string } {
  const node = nodes[nodeIndex]

  if (!node) {
    throw new Error(`No node at index ${nodeIndex}`)
  }

  // Check node type and throw an error if it's not a JSXNode
  if (node.type !== 'mdxJsxFlowElement') {
    throw new Error(`Node at index ${nodeIndex} is not a JSXNode`)
  }

  // Replace the node in the list of nodes
  const newNodes = [...nodes]
  newNodes[nodeIndex] = {
    ...node,
    value: replacement,
    // Update end position according to the length of the replacement string
    position: {
      ...node.position,
      end: determineLineAndColumn(originalDoc, node.position.start.offset + replacement.length),
    },
  }

  // Replace the corresponding part of the original document
  const newDoc =
    originalDoc.slice(0, node.position.start.offset) + replacement + originalDoc.slice(node.position.end.offset)

  return { newNodes, newDoc }
}

export function addNodeToDocumentAst(
  nodes: DocumentNode[],
  originalDoc: string,
  addAfterIndex: number,
  additionalNode: string
): { newNodes: DocumentNode[]; newDoc: string } {
  const node = nodes[addAfterIndex]

  if (!node) {
    throw new Error(`No node at index ${addAfterIndex}`)
  }

  // Calculate the offset for the additional node
  const additionalNodeOffset = node.position.end.offset + 1

  // Create the new node
  const newNode: JSXNode = {
    tagName: 'custom', // change this based on your additionalNode
    type: 'jsx', // Assuming additional node is JSX
    value: additionalNode,
    attrs: [], // Add attributes based on your additionalNode
    children: [], // Add children based on your additionalNode
    position: {
      start: determineLineAndColumn(originalDoc, additionalNodeOffset),
      end: determineLineAndColumn(originalDoc, additionalNodeOffset + additionalNode.length),
    },
  }

  // Insert the new node into the list of nodes
  const newNodes = [...nodes.slice(0, addAfterIndex + 1), newNode, ...nodes.slice(addAfterIndex + 1)]

  // Adjust the positions of all nodes after the added node
  for (let i = addAfterIndex + 2; i < newNodes.length; i++) {
    const nodeToAdjust = newNodes[i]
    const adjustmentAmount = newNode.position.end.offset - nodeToAdjust.position.start.offset + 1
    nodeToAdjust.position.start = determineLineAndColumn(
      originalDoc,
      nodeToAdjust.position.start.offset + adjustmentAmount
    )
    nodeToAdjust.position.end = determineLineAndColumn(originalDoc, nodeToAdjust.position.end.offset + adjustmentAmount)
  }

  // Insert the new node into the original document
  const newDoc =
    originalDoc.slice(0, node.position.end.offset + 1) +
    additionalNode +
    originalDoc.slice(node.position.end.offset + 1)

  return { newNodes, newDoc }
}

export function mutateDocumentAst(
  nodes: DocumentNode[],
  originalDoc: string,
  nodeAddition: string,
  beforeIndex: number
): string {
  const node = nodes[beforeIndex]

  if (!node) {
    throw new Error(`No node at index ${beforeIndex}`)
  }

  // Determine the position of the new node. It should end where the current node starts.
  const position = {
    start: determineLineAndColumn(originalDoc, node.position.start.offset - nodeAddition.length),
    end: node.position.start,
  }

  // Create the new node
  const newNode: TextBlockNode = {
    type: 'text',
    value: nodeAddition,
    position,
  }

  // Insert the new node before the specified node
  const newNodes = [...nodes]
  newNodes.splice(beforeIndex, 0, newNode)

  // Add the node addition to the original document
  const newDoc =
    originalDoc.slice(0, node.position.start.offset) + nodeAddition + originalDoc.slice(node.position.start.offset)

  // Validate that the new AST matches the newDoc. Throw an error if it doesn't.
  // if (documentNodesToAst(newNodes, newDoc) !== newDoc) {
  //   throw new Error('Updated AST does not match updated document')
  // }

  return newDoc
}
// export function mutateDocumentAst(
//   nodes: DocumentNode[],
//   originalDoc: string,
//   nodeAddition: string,
//   afterIndex: number
// ): string {
//   const node = nodes[afterIndex]

//   if (!node) {
//     throw new Error(`No node at index ${afterIndex}`)
//   }

//   // Determine the position of the new node. It should start where the previous node ended.
//   const position = {
//     start: node.position.end,
//     end: determineLineAndColumn(originalDoc, node.position.end.offset + nodeAddition.length),
//   }

//   // Create the new node
//   const newNode: TextBlockNode = {
//     type: 'text',
//     value: nodeAddition,
//     position,
//   }

//   // Insert the new node after the specified node
//   const newNodes = [...nodes]
//   newNodes.splice(afterIndex + 1, 0, newNode)

//   // Add the node addition to the original document
//   const newDoc =
//     originalDoc.slice(0, node.position.end.offset) + nodeAddition + originalDoc.slice(node.position.end.offset)

//   // Validate that the new AST matches the newDoc. Throw an error if it doesn't.
//   // if (documentNodesToAst(newNodes, newDoc) !== newDoc) {
//   //   throw new Error('Updated AST does not match updated document')
//   // }

//   return newDoc
// }
