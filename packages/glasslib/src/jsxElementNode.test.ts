import { expect } from 'chai'
import { getJSXNodeInsidesString, getJSXNodeShellString, getJSXNodeString } from './jsxElementNode'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

describe('jsxElementNode', () => {
  const doc = `<Code>
const a = "hello world"
</Code>

<Chat model="gpt-4" onResponse={() => {}}>
\${a}
</Chat>`

  const nodes = parseGlassTopLevelJsxElements(doc)

  it('should return node string', () => {
    expect(getJSXNodeString(nodes[0], doc)).to.equal(`<Code>
const a = "hello world"
</Code>`)
    expect(getJSXNodeString(nodes[1], doc)).to.equal(`<Chat model="gpt-4" onResponse={() => {}}>
\${a}
</Chat>`)
  })

  it('should return node insides', () => {
    expect(getJSXNodeInsidesString(nodes[0], doc)).to.equal(`const a = "hello world"`)
    expect(getJSXNodeInsidesString(nodes[1], doc)).to.equal(`\${a}`)
  })

  it('should return node shell', () => {
    expect(getJSXNodeShellString(nodes[1], doc)).to.equal(`<Chat model="gpt-4" onResponse={() => {}}>

</Chat>`)
  })
})
