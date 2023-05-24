import { expect } from 'chai'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'
describe('parseGlassTopLevelJsxElements', () => {
  it('should parse glass document', () => {
    const mdx = `Hello world this is a document.

<Foo x={3} y="2" />

interstitial

<Bar x={(m) => "hello"}>
</Bar>

<For each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    expect(parseGlassTopLevelJsxElements(mdx)).to.deep.equal([
      {
        tagName: 'Foo',
        attrs: [
          { name: 'x', expressionValue: '3' },
          { name: 'y', stringValue: '2' },
        ],
        children: [],
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
        type: 'mdxJsxFlowElement',
      },
      {
        tagName: 'Bar',
        attrs: [{ name: 'x', expressionValue: '(m) => "hello"' }],
        children: [],
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
        type: 'mdxJsxFlowElement',
      },
      {
        tagName: 'For',
        attrs: [
          { name: 'each', expressionValue: 'messages' },
          { name: 'fragment', expressionValue: 'm => <Block role={m.role} content={m.text} />' },
        ],
        children: [],
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
        type: 'mdxJsxFlowElement',
      },
    ])
  })

  it('should parse glass document with Python code', () => {
    const mdx = `Hello world this is a document.

<Code language="python">
a = {"hello": "world"}
b = list(map(lambda x: x + 1, [1, 2, 3]))
</Code>

<Block role="system" content={(lambda x: x + " world")("hello")} />
`

    expect(parseGlassTopLevelJsxElements(mdx)).to.deep.equal([
      {
        attrs: [
          {
            name: 'language',
            stringValue: 'python',
          },
        ],
        children: [
          {
            attrs: [],
            children: [
              {
                attrs: [],
                children: [],
                position: {
                  end: {
                    column: 5,
                    line: 4,
                    offset: 62,
                  },
                  start: {
                    column: 1,
                    line: 4,
                    offset: 58,
                  },
                },
                tagName: undefined,
                type: 'text',
                value: 'a = ',
              },
              {
                attrs: [],
                children: [],
                position: {
                  end: {
                    column: 23,
                    line: 4,
                    offset: 80,
                  },
                  start: {
                    column: 5,
                    line: 4,
                    offset: 62,
                  },
                },
                tagName: undefined,
                type: 'mdxTextExpression',
                value: '"hello": "world"',
              },
              {
                attrs: [],
                children: [],
                position: {
                  end: {
                    column: 42,
                    line: 5,
                    offset: 122,
                  },
                  start: {
                    column: 23,
                    line: 4,
                    offset: 80,
                  },
                },
                tagName: undefined,
                type: 'text',
                value: '\nb = list(map(lambda x: x + 1, [1, 2, 3]))',
              },
            ],
            position: {
              end: {
                column: 42,
                line: 5,
                offset: 122,
              },
              start: {
                column: 1,
                line: 4,
                offset: 58,
              },
            },
            tagName: undefined,
            type: 'paragraph',
          },
        ],
        position: {
          end: {
            column: 8,
            line: 6,
            offset: 130,
          },
          start: {
            column: 1,
            line: 3,
            offset: 33,
          },
        },
        tagName: 'Code',
        type: 'mdxJsxFlowElement',
      },
      {
        attrs: [
          {
            name: 'role',
            stringValue: 'system',
          },
          {
            expressionValue: '(lambda x: x + " world")("hello")',
            name: 'content',
          },
        ],
        children: [],
        position: {
          end: {
            column: 68,
            line: 8,
            offset: 199,
          },
          start: {
            column: 1,
            line: 8,
            offset: 132,
          },
        },
        tagName: 'Block',
        type: 'mdxJsxFlowElement',
      },
    ])
  })

  it('should parse glass document with commented out nodes', () => {
    const mdx = `// <System>
// hello world
//</System>`

    expect(parseGlassTopLevelJsxElements(mdx)).to.deep.equal([])
  })

  it('should parse glass document with commented out insides', () => {
    const mdx = `<System>
// hello world
</System>`

    expect(parseGlassTopLevelJsxElements(mdx)).to.have.length(1)
  })

  it('should parse glass document with nested elements', () => {
    const mdx = `<System>
<User>
hello
</User>
</System>`

    expect(parseGlassTopLevelJsxElements(mdx)).to.have.length(1)
  })
})
