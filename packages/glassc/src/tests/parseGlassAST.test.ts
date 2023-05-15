import { expect } from 'chai'
import { jsxNodeToString } from '../parseJSX'
import { JSXNode, parseGlassASTJSX } from '../util/parseGlassAST'

describe('parseGlassAST', () => {
  it('should parse JSX', () => {
    const mdx = `Hello world this is a document.

<Foo x={3} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

<for each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    expect(parseGlassASTJSX(mdx)).to.deep.equal([
      {
        tagName: 'Foo',
        attrs: [
          { name: 'x', expressionValue: '3' },
          { name: 'y', stringValue: '2' },
        ],
        position: {
          end: {
            column: 20,
            line: 3,
            offset: 52,
          },
          start: {
            column: 1,
            line: 3,
            offset: 33,
          },
        },
      },
      {
        tagName: 'Bar',
        attrs: [{ name: 'x', expressionValue: '(m) => "hello"' }],
        position: {
          end: {
            column: 7,
            line: 8,
            offset: 99,
          },
          start: {
            column: 1,
            line: 7,
            offset: 68,
          },
        },
      },
      {
        tagName: 'for',
        attrs: [
          { name: 'each', expressionValue: 'messages' },
          { name: 'fragment', expressionValue: 'm => <Block role={m.role} content={m.text} />' },
        ],
        position: {
          end: {
            column: 81,
            line: 10,
            offset: 181,
          },
          start: {
            column: 1,
            line: 10,
            offset: 101,
          },
        },
      },
    ])
  })

  it('should convert JSXNode to string', () => {
    const node: JSXNode = {
      tagName: 'for',
      attrs: [
        { name: 'each', expressionValue: 'messages' },
        { name: 'fragment', expressionValue: 'm => <Block role={m.role} content={m.text} />' },
      ],
      position: {
        end: {
          column: 81,
          line: 10,
          offset: 181,
        },
        start: {
          column: 1,
          line: 10,
          offset: 101,
        },
      },
    }

    expect(jsxNodeToString(node)).to.deep.equal(
      '<for each={messages} fragment={m => <Block role={m.role} content={m.text} />} />'
    )
  })
})
