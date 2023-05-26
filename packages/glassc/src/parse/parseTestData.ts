import glasslib from '@glass-lang/glasslib'
import { checkOk } from '@glass-lang/util'

export function parseTestData(nodes: glasslib.JSXNode[], doc: string) {
  const testNodes = nodes.filter(node => node.tagName === 'Test')
  checkOk(testNodes.length <= 1, 'Only one <Test> block is allowed per file')
  const testData = testNodes.map(n => {
    if (n.children.length === 0) {
      return ''
    }
    // get the inside content of the node
    return doc.substring(n.children[0].position.start.offset, n.children[n.children.length - 1].position.end.offset)
  })

  // verify at most one test block?

  return (testData[0] || '').trim()
}
