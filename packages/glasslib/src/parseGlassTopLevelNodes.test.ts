import { expect } from 'chai'
import { documentNodesToAst, mutateDocumentAst, updateDocumentAst } from './ast'
import { parseGlassTopLevelCode, parseGlassTopLevelNodes } from './parseGlassTopLevelNodes'

describe('parseGlassTopLevelNodes', () => {
  it('should extract code blocks', () => {
    const mdx = `Hello world this is a document.

<Foo x={3} y="2" />

interstitial
def foo():
  return 3

<Bar x={(m) => "hello"}>
</Bar>

And this is the end`

    const parsed = parseGlassTopLevelCode(mdx)
    expect(parsed).to.equal(`Hello world this is a document.




interstitial
def foo():
  return 3




And this is the end`)
  })

  it('should parse glass document', () => {
    const mdx = `Hello world this is a document.

<Foo x={3} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

<For each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    const parsed = parseGlassTopLevelNodes(mdx)
    expect(documentNodesToAst(parsed, mdx)).to.equal(mdx)
  })

  it('should updateDocumentAst', () => {
    const mdx = `Hello world this is a document.

<Foo x={3} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

<For each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    const expected = `Hello world this is a document.

<Bar x={4} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

<For each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    const parsed = parseGlassTopLevelNodes(mdx)
    const { newNodes, newDoc } = updateDocumentAst(parsed, mdx, 1, '<Bar x={4} y="2" />')
    expect(newDoc).to.equal(expected)
    expect(documentNodesToAst(newNodes, newDoc)).to.equal(expected)
  })

  it('should addNodeToDocumentAST', () => {
    const mdx = `Hello world this is a document.

<Foo x={3} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

And this is the end`

    const expected = `Hello world this is a document.

<Foo x={3} y="2" />
<Bar x={4} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

And this is the end`

    const expected2 = `<Bar x={4} y="2" />
Hello world this is a document.

<Foo x={3} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

And this is the end`

    const parsed = parseGlassTopLevelNodes(mdx)
    const newDoc = mutateDocumentAst(parsed, mdx, '\n<Bar x={4} y="2" />', 2)
    expect(newDoc).to.equal(expected)

    const newDoc2 = mutateDocumentAst(parsed, mdx, '<Bar x={4} y="2" />\n', 0)
    expect(newDoc2).to.equal(expected2)
  })
})
