import { JSXNode } from './ast'

export function getJSXNodeString(node: JSXNode, doc: string) {
  const start = node.position.start.offset
  const end = node.position.end.offset
  return doc.slice(start, end)
}

export function getJSXNodeInsidesString(node: JSXNode, doc: string) {
  if (node.children.length === 0) {
    return ''
  }
  return doc.substring(
    node.children[0].position.start.offset,
    node.children[node.children.length - 1].position.end.offset
  )
}

export function getJSXNodeShellString(node: JSXNode, doc: string) {
  const nodeStr = getJSXNodeString(node, doc)
  const insidesStr = getJSXNodeInsidesString(node, doc)
  if (insidesStr === '') {
    return nodeStr
  }

  return nodeStr.replace(insidesStr, '')
}
