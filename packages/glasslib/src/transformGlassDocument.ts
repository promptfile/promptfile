import { JSXNode } from './ast'
import { getJSXNodeInsidesString, getJSXNodeString } from './jsxElementNode'
import { parseGlassTopLevelNodes } from './parseGlassTopLevelNodes'
import { addNodeToDocument, parseGlassTopLevelNodesNext, replaceDocumentNode } from './parseGlassTopLevelNodesNext'

export function transformGlassDocument(initDocument: string, interpolatedDocument: string) {
  const parsedInit = parseGlassTopLevelNodesNext(initDocument)
  const parsedInterp = parseGlassTopLevelNodesNext(interpolatedDocument)

  let transformedInit = initDocument
  let transformedInterp = interpolatedDocument

  const loopNode = parsedInit.find(node => (node as any).tagName === 'Loop')
  let loopIndex = -1
  if (loopNode) {
    loopIndex = parsedInit.indexOf(loopNode)

    const newInitDoc = replaceDocumentNode(
      getJSXNodeInsidesString(loopNode as JSXNode, initDocument),
      loopIndex,
      initDocument
    )

    const newDocNodes = parseGlassTopLevelNodes(newInitDoc)

    const nodesLengthDiff = newDocNodes.length - parsedInit.length

    transformedInit = addNodeToDocument(
      '\n' + getJSXNodeString(loopNode as JSXNode, initDocument),
      nodesLengthDiff + loopIndex + 1,
      newInitDoc
    )
  }

  const interpLoopNode = parsedInterp.find(node => (node as any).tagName === 'Loop')
  let interpLoopIndex = -1
  if (interpLoopNode) {
    interpLoopIndex = parsedInterp.indexOf(interpLoopNode)

    const newInterpDoc = replaceDocumentNode(
      getJSXNodeInsidesString(interpLoopNode as JSXNode, interpolatedDocument),
      interpLoopIndex,
      interpolatedDocument
    )

    const newDocNodes = parseGlassTopLevelNodes(newInterpDoc)

    const nodesLengthDiff = newDocNodes.length - parsedInterp.length

    transformedInterp = addNodeToDocument(
      '\n' + getJSXNodeString(loopNode as JSXNode, initDocument),
      nodesLengthDiff + loopIndex + 1,
      newInterpDoc
    )
  }

  return { transformedInit, transformedInterp }
}

export function replaceStateNode(newStateNode: string, doc: string) {
  const parsed = parseGlassTopLevelNodesNext(doc)

  const stateNode = parsed.find(node => (node as any).tagName === 'State')
  if (!stateNode) {
    // see if the first node is a text node, if so, insert the state node after its frontmatter
    const existingFrontmatter = /---\n?([\s\S]*?)\n?---/.exec(doc)?.[1] ?? ''
    if (existingFrontmatter) {
      // find the index of the second '---\n' sequence
      const secondFrontmatterIndex = doc.indexOf('---\n', doc.indexOf('---\n') + 1)
      // return doc with the state node inserted after the second frontmatter, otherwise doc unchanged
      return secondFrontmatterIndex > -1
        ? doc.slice(0, secondFrontmatterIndex + 4) + '\n' + newStateNode + '\n' + doc.slice(secondFrontmatterIndex + 4)
        : doc
    } else {
      return addNodeToDocument(newStateNode + '\n', 0, doc)
    }
  }

  const stateIndex = parsed.indexOf(stateNode)
  const newDoc = replaceDocumentNode(newStateNode, stateIndex, doc)
  return newDoc
}

export function replaceRequestNode(newRequestNode: string, doc: string) {
  const parsed = parseGlassTopLevelNodesNext(doc)

  const requestNode = parsed.find(node => (node as any).tagName === 'Request')
  if (!requestNode) {
    return doc
  }

  const stateIndex = parsed.indexOf(requestNode)
  const newDoc = replaceDocumentNode(newRequestNode, stateIndex, doc)
  return newDoc
}
