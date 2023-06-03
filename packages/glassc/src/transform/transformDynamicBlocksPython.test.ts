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
    const glass = `<User>
\${foo}
</User>`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: ['foo'],
      nestedInterpolations: {},
      jsxInterpolations: {
        '0': '"""{}""".format("""<User>\n{}\n</User>""".format("""{}""".format(foo)))',
      },
      doc: '${GLASSVAR[0]}',
    })
  })

  it('should do simple doc with if condition', () => {
    const glass = `<User if={bar}>
\${foo}
</User>`

    expect(transformDynamicBlocksPython(glass)).to.deep.equal({
      undeclaredSymbols: ['bar', 'foo'],
      nestedInterpolations: {},
      jsxInterpolations: {
        0: `"""{}""".format("""<User if={{"{}"}}>
{}
</User>""".format(bar, """{}""".format(foo))) if bar else ''`,
      },
      doc: '${GLASSVAR[0]}',
    })
  })

  it('should transform document with dynamic for block with body', () => {
    const glass = `Hello world this is a document.

<For each={messages} as="m">
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
      nestedInterpolations: {
        '0': '"""{}""".format(m.foo)',
        '1': '"""bar""".format()',
      },
      jsxInterpolations: {
        '0': '"\\n\\n".join(list(map(lambda m: """{}""".format("""{}\n\n{}""".format("""<User>\n{}\n</User>""".format("""{}""".format(m.foo)), """<Assistant>\n{}\n</Assistant>""".format("""bar""".format()))), messages)))',
      },
      doc: 'Hello world this is a document.\n\n${GLASSVAR[0]}\n\nAnd this is the end',
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
          '0': '"""With nested if block {}""".format(withvar) if True else \'\'',
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
          '0': '"""With nested if block {}""".format(withvar) if True else \'\'',
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
          '0': '"""With nested if block {}""".format(withvar) if True else \'\'',
          '1': '"""do something""".format() if False else \'\'',
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

      expect(transformDynamicBlocksPython(glass)).to.deep.equal({
        nestedInterpolations: {
          '0': '"""who was gandhi?""".format() if useGandhi else \'\'',
          '1': '"""who was Einstein?""".format() if !useGandhi else \'\'',
          '2': '"""who was gandhi?""".format() if useGandhi else \'\'',
          '3': '"""who was Einstein?""".format() if !useGandhi else \'\'',
        },
        undeclaredSymbols: [],
        jsxInterpolations: {
          '0': '"""{}""".format("""<Code>\n{}\n</Code>""".format("""const useGandhi = true""".format()))',
          '1': '"""{}""".format("""<System>\n{}\n</System>""".format("""You are a highly-intelligent AI.""".format()))',
          '2': '"""{}""".format("""<User>\n{}\n</User>""".format("""{}\n\n{}""".format(GLASSVAR[0], GLASSVAR[1])))',
          '3': '"""{}""".format("""<User>\n{}\n</User>""".format("""{}\n\n{}""".format(GLASSVAR[2], GLASSVAR[3])))',
        },
        doc: '${GLASSVAR[0]}\n\n${GLASSVAR[1]}\n\n${GLASSVAR[2]}\n\n${GLASSVAR[3]}',
      })
    })
  })
})
