import { expect } from 'chai'
import { transformDynamicBlocks } from './transformDynamicBlocks'
import { transformDynamicBlocksPython } from './transformDynamicBlocksPython'

describe('transformDynamicBlocksPython', () => {
  it('should ignore document without dynamic blocks', () => {
    const glass = `Hello world this is a document.

<Foo x={3} y="2" />

And this is the end`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: [],
      jsxInterpolations: {},
      doc: glass,
    })
  })

  it('should transform document with dynamic for block with body', () => {
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
      jsxInterpolations: {
        '0': `"\\n\\n".join(list(map(lambda m: """{}""".format("""{}

{}""".format("""<User>
{}
</User>""".format("""{}""".format(m.foo)), """<Assistant>
{}
</Assistant>""".format("""bar""".format()))), messages)))`,
      },
      doc: 'Hello world this is a document.\n\n${GLASSVAR[0]}\n\nAnd this is the end',
    })
  })

  it('should transform document with if condition', () => {
    const glass = `Hello world this is a document.

<User if={user.isAdmin} />`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: ['user'],
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
        jsxInterpolations: {
          '0': `"""{}""".format("""<Text if="True">
{}
</Text>""".format("""With nested if block {}""".format(withvar))) if True else ''`,
        },
        doc: '<User>\nInner stuff\n${GLASSVAR[0]}\nand more\n</User>',
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
        jsxInterpolations: {
          '0': `"""{}""".format("""<Text if="True">
{}
</Text>""".format("""With nested if block {}""".format(withvar))) if True else ''`,
          '1': `"""{}""".format("""<User if="True">
{}
</User>""".format("""Inner stuff
{}
and more""".format(GLASSVAR[0]))) if True else ''`,
        },
        doc: '${GLASSVAR[1]}',
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
        jsxInterpolations: {
          '0': `"""{}""".format("""<Text if="True">
{}
</Text>""".format("""With nested if block {}""".format(withvar))) if True else ''`,
          '1': `"""{}""".format("""<User if="True">
{}
</User>""".format("""Inner stuff
{}
and more""".format(GLASSVAR[0]))) if True else ''`,
          '2': `"""{}""".format("""<Text if="False">
{}
</Text>""".format("""do something""".format())) if False else ''`,
          '3': `"""{}""".format("""<Assistant if="True">
{}
</Assistant>""".format("""{}""".format(GLASSVAR[2]))) if True else ''`,
        },
        doc: '<System>\nsystem prompt\n</System>\n\n${GLASSVAR[1]}\n\n${GLASSVAR[3]}\n\n<User>\nleft alone\n</User>',
      })
    })

    it('should transform document with nested text expressions', () => {
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

      expect(transformDynamicBlocks(glass)).to.deep.equal({
        jsxInterpolations: {
          'jsx-0': "useGandhi ? `<Text if={useGandhi}>\nwho was gandhi?\n</Text>` : ''",
          'jsx-1': "!useGandhi ? `<Text if={!useGandhi}>\nwho was Einstein?\n</Text>` : ''",
          'jsx-2': "useGandhi ? `<Text if={useGandhi}>\nwho was gandhi?\n</Text>` : ''",
          'jsx-3': "!useGandhi ? `<Text if={!useGandhi}>\nwho was Einstein?\n</Text>` : ''",
        },
        doc: '<Code>\nconst useGandhi = true\n</Code>\n\n<System>\nYou are a highly-intelligent AI.\n</System>\n\n<User>\n${jsx-0}\n\n${jsx-1}\n</User>\n\n<User>\n<Text if={useGandhi}>\nwho was gandhi?\n</Text>\n\n<Text if={!useGandhi}>\n<User>\n${jsx-2}\n\n${jsx-3}\n</User>',
      })
    })
  })
})
