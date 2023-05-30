import { JSXNode } from './ast'

export function parseGlassArgs(node?: JSXNode | null) {
  if (node == null) {
    return {}
  }

  const res: any = {}
  for (const attr of node.attrs) {
    res[attr.name] = JSON.parse(attr.expressionValue!)
  }
  return res
}

export function constructGlassArgsNode(args: any = {}) {
  const kvPairs = Object.keys(args).map(a => `${a}={${JSON.stringify(args[a])}}`)
  return `<Args ${kvPairs.join(' ')} />`
}
