import { expect } from 'chai'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'
import { parseGlassTopLevelNodesNext, reconstructDocFromNodes } from './parseGlassTopLevelNodesNext'
import { replaceLiterals, restoreLiterals } from './replaceLiterals'
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

  it('shoudl parse python output', () => {
    const doc = `import requests from "requests"

response = requests.get("https://elliottburris.com")

<System>
your job is to answer questions based on the following website code:
###
<Literal>
<html lang="en">
<head>
        <meta charset="UTF-8">
        <title>Elliott Burris</title>
</head>
<body>
        <div class="main" style="padding-left:10px;">
                <h1>Elliott Burris</h1>

                <h3>Current</h3>
                Co-founder & CEO at stealth AI startup<br>
                Chairman at stealth real estate startup<br>


                <h3>Past</h3>
                Founder and CEO of <a href="https://dynasty.com" target="_blank">Dynasty.com</a> (acquired by <a
                        href="https://www.appfolio.com/">AppFolio</a>)<br>
                <a href="http://www.twosigma.com/" target="_blank">Two Sigma Investments</a><br>
                <a href="http://www.twosigmasecurities.com/" target="_blank">Two Sigma Securities</a><br>

                <h3>Education</h3>
                <a href="http://www.cam.ac.uk/" target="_blank">Cambridge, M.Phil.</a><br>
                <a href="http://virginia.edu/" target="_blank">UVA, B.A.</a>    <br>    <br>

                <h3>Online</h3>
                <a href="https://github.com/elliottburris" target="_blank">GitHub</a><br>
                <a href="https://www.linkedin.com/in/elliottburris" target="_blank">LinkedIn</a><br>
                <a href="https://twitter.com/elliott_burris" target="_blank">Twitter</a><br>

        </div>
        <script>
                console.log("Contact me at e l l i o t t . b u r r i s [at] g m a i l [dot] c o m");
        </script>

</body>

</html>
</Literal>
###
</System>

<User>
hey where did elliott go to grad school?
</User>

<Assistant>
Elliott Burris went to graduate school at Cambridge, where he received an M.Phil.
</Assistant>

<User>
what is elliott's favorite color?
</User>

<Assistant>
Sorry, we cannot determine Elliott's favorite color from the provided website code.
</Assistant>

<User>
what is elliott's last name?
</User>

<Request model="gpt-3.5-turbo">

</Request>`

    const replaced = replaceLiterals(doc)

    const parsed = parseGlassTopLevelNodesNext(replaced.output)

    const reconstructed = reconstructDocFromNodes(parsed, replaced.output)
    expect(restoreLiterals(reconstructed, replaced.replacements)).to.equal(doc)
  })
})
