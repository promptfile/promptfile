import { expect } from 'chai'
import { transformDynamicBlocksPython } from './transformDynamicBlocksPython'

describe('transformDynamicBlocksPython', () => {
  it('should ignore document without dynamic blocks', () => {
    const glass = `Hello world this is a document.

<Foo x={3} y="2" />

And this is the end`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: [],
      nestedInterpolations: {},
      jsxInterpolations: {
        '0': `"""{}""".format("""<Foo x={{"{}"}} y="2">
{}
</Foo>""".format(3, """""".format()))`,
      },
      doc: 'Hello world this is a document.\n\n${GLASSVAR[0]}\n\nAnd this is the end',
    })
  })

  it('should do simple doc', () => {
    const glass = `<Prompt>
\${foo}
</Prompt>`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: ['foo'],
      nestedInterpolations: {},
      jsxInterpolations: {
        '0': '"""{}""".format("""<Prompt>\n{}\n</Prompt>""".format("""{}""".format(foo)))',
      },
      doc: '${GLASSVAR[0]}',
    })
  })

  it('should do simple doc with if condition', () => {
    const glass = `<Prompt if={bar}>
\${foo}
</Prompt>`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: ['bar', 'foo'],
      nestedInterpolations: {},
      jsxInterpolations: {
        0: `"""{}""".format("""<Prompt if={{"{}"}}>
{}
</Prompt>""".format(bar, """{}""".format(foo))) if bar else ''`,
      },
      doc: '${GLASSVAR[0]}',
    })
  })

  it.skip('should transform document with dynamic for block with body', () => {
    const glass = `Hello world this is a document.

<For each={messages} item="m">
<User>
\${m.foo}
</User>

<Assistant>
bar
</Assistant>
</For>

And this is the end`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: [],
      nestedInterpolations: {},
      jsxInterpolations: {
        '0': `"""{}""".format("""<User>
{}
</User>""".format("""{}""".format(m.foo)))`,
        '1': `"""{}""".format("""<Assistant>
{}
</Assistant>""".format("""bar""".format()))`,
        '2': `"\\n\\n".join(list(map(lambda m: """{}""".format("""{}

{}""".format("""<User>
{}
</User>""".format("""{}""".format(m.foo)), """<Assistant>
{}
</Assistant>""".format("""bar""".format()))), messages)))`,
      },
      doc: 'Hello world this is a document.\n\n${GLASSVAR[2]} And this is the end',
    })
  })

  it('should transform document with if condition', () => {
    const glass = `Hello world this is a document.

<User if={user.isAdmin} />`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: ['user'],
      nestedInterpolations: {},
      jsxInterpolations: {
        '0': `"""{}""".format("""<User if={{"{}"}}>
{}
</User>""".format(user.isAdmin, """""".format())) if user.isAdmin else ''`,
      },
      doc: 'Hello world this is a document.\n\n${GLASSVAR[0]}',
    })
  })

  describe('nested blocks', () => {
    it('should transform document with nested dynamic text block', () => {
      const glass = `<User>
Inner stuff
<Text if="True">
With nested if block \${withvar}
</Text>
and more
</User>`

      expect(transformDynamicBlocksPython(glass)).to.deep.equal({
        undeclaredSymbols: ['withvar'],
        nestedInterpolations: {
          '0': `"""{}""".format("""<Text if="True">
{}
</Text>""".format("""With nested if block {}""".format(withvar))) if True else ''`,
        },
        jsxInterpolations: {
          '0': `"""{}""".format("""<User>
{}
</User>""".format("""Inner stuff
{}
and more""".format(GLASSVAR[0])))`,
        },
        doc: '${GLASSVAR[0]}',
      })
    })

    it('should transform document with dynamic block with nested block', () => {
      const glass = `<User if="True">
Inner stuff
<Text if="True">
With nested if block \${withvar}
</Text>
and more
</User>`

      expect(transformDynamicBlocksPython(glass)).to.deep.equal({
        nestedInterpolations: {
          '0': '"""{}""".format("""<Text if="True">\n{}\n</Text>""".format("""With nested if block {}""".format(withvar))) if True else \'\'',
        },
        jsxInterpolations: {
          '0': `"""{}""".format("""<User if="True">
{}
</User>""".format("""Inner stuff
{}
and more""".format(GLASSVAR[0]))) if True else ''`,
        },
        doc: '${GLASSVAR[0]}',
        undeclaredSymbols: ['withvar'],
      })
    })

    it('should transform document with multiple dynamic nested blocks', () => {
      const glass = `<System>
system prompt
</System>

<User if="True">
Inner stuff
<Text if="True">
With nested if block \${withvar}
</Text>
and more
</User>

<Assistant if="True">
<Text if="False">
do something
</Text>
</Assistant>

<User>
left alone
</User>`

      expect(transformDynamicBlocksPython(glass)).to.deep.equal({
        undeclaredSymbols: ['withvar'],
        nestedInterpolations: {
          '0': `"""{}""".format("""<Text if="True">
{}
</Text>""".format("""With nested if block {}""".format(withvar))) if True else ''`,
          '1': '"""{}""".format("""<Text if="False">\n{}\n</Text>""".format("""do something""".format())) if False else \'\'',
        },
        jsxInterpolations: {
          '0': `"""{}""".format("""<System>
{}
</System>""".format("""system prompt""".format()))`,
          '1': '"""{}""".format("""<User if="True">\n{}\n</User>""".format("""Inner stuff\n{}\nand more""".format(GLASSVAR[0]))) if True else \'\'',
          '2': '"""{}""".format("""<Assistant if="True">\n{}\n</Assistant>""".format("""{}""".format(GLASSVAR[1]))) if True else \'\'',
          '3': `"""{}""".format("""<User>
{}
</User>""".format("""left alone""".format()))`,
        },
        doc: '${GLASSVAR[0]}\n\n${GLASSVAR[1]}\n\n${GLASSVAR[2]}\n\n${GLASSVAR[3]}',
      })
    })

    it.skip('should transform document with nested text expressions', () => {
      const glass = `<Code>
const useGandhi = true
</Code>

<System>
You are a highly-intelligent AI.
</System>

<User>
<Text if={useGandhi}>
who was gandhi?
</Text>

<Text if={!useGandhi}>
who was Einstein?
</Text>
</User>

<User>
<Text if={useGandhi}>
who was gandhi?
</Text>

<Text if={!useGandhi}>
who was Einstein?
</Text>
</User>`

      expect(transformDynamicBlocksPython(glass)).to.deep.equal({
        jsxInterpolations: {
          'jsx-0': "useGandhi ? `<Text if={useGandhi}>\nwho was gandhi?\n</Text>` : ''",
          'jsx-1': "!useGandhi ? `<Text if={!useGandhi}>\nwho was Einstein?\n</Text>` : ''",
          'jsx-2': "useGandhi ? `<Text if={useGandhi}>\nwho was gandhi?\n</Text>` : ''",
          'jsx-3': "!useGandhi ? `<Text if={!useGandhi}>\nwho was Einstein?\n</Text>` : ''",
        },
        doc: '<Code>\nconst useGandhi = true\n</Code>\n\n<System>\nYou are a highly-intelligent AI.\n</System>\n\n<User>\n${jsx-0}\n\n${jsx-1}\n</User>\n\n<User>\n<Text if={useGandhi}>\nwho was gandhi?\n</Text>\n\n<Text if={!useGandhi}>\n<User>\n${jsx-2}\n\n${jsx-3}\n</User>',
      })
    })

    it.skip('should transform document with literal', () => {
      const glass = `---
language: python
---

import requests from "requests"

response = requests.get("https://elliottburris.com")

<System>
your job is to answer questions based on the following website code:
###
<Text escapeHtml>
\${response.text}
</Text>
###
</System>`

      expect(transformDynamicBlocksPython(glass)).to.deep.equal({
        jsxInterpolations: {},
        doc: '',
      })
    })
  })
})
