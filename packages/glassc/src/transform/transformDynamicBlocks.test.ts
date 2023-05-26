import { expect } from 'chai'
import { transformDynamicBlocks } from './transformDynamicBlocks'

describe('transformDynamicBlocks', () => {
  it('should ignore document without dynamic blocks', () => {
    const glass = `Hello world this is a document.

<Foo x={3} y="2" />

And this is the end`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {},
      doc: glass,
    })
  })

  it('should transform document with dynamic for block with fragment', () => {
    const glass = `Hello world this is a document.

<For each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0':
          "messages.map(m => `<Block role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n</Block>`).join('\\n\\n')",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}\n\nAnd this is the end',
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

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0': "messages.map(m => `<User>\n${m.foo}\n</User>\n\n<Assistant>\nbar\n</Assistant>`).join('\\n\\n')",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}\n\nAnd this is the end',
    })
  })

  it('should transform document with dynamic if/for block', () => {
    const glass = `Hello world this is a document.

<For if={true} each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0':
          "true ? messages.map(m => `<Block role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n</Block>`).join('\\n\\n') : ''",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}\n\nAnd this is the end',
    })
  })

  it('should transform document with multiple dynamic for block', () => {
    const glass = `Hello world this is a document.

<For each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

This is the middle
<For each={messages2} fragment={m => <Block role={m.role} content={m.text} />} />
And this is the end`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0':
          "messages.map(m => `<Block role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n</Block>`).join('\\n\\n')",
        'jsx-1':
          "messages2.map(m => `<Block role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n</Block>`).join('\\n\\n')",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}\n\nThis is the middle\n${jsx-1}\nAnd this is the end',
    })
  })

  it('should transform document with if condition', () => {
    const glass = `Hello world this is a document.

<User if={user.isAdmin} />`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0': "user.isAdmin ? `<User if={user.isAdmin} />` : ''",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}',
    })
  })

  describe('nested blocks', () => {
    it('should transform document with nested dynamic text block', () => {
      const glass = `<User>
Inner stuff
<Text if="true">
With nested if block \${withvar}
</Text>
and more
</User>`

      expect(transformDynamicBlocks(glass)).to.deep.equal({
        jsxInterpolations: {
          'jsx-0': `true ? \`<Text if=\"true\">\nWith nested if block \${withvar}\n</Text>\` : ''`,
        },
        doc: '<User>\nInner stuff\n${jsx-0}\nand more\n</User>',
      })
    })

    it('should transform document with dynamic block with nested block', () => {
      const glass = `<User if="true">
Inner stuff
<Text if="true">
With nested if block \${withvar}
</Text>
and more
</User>`

      expect(transformDynamicBlocks(glass)).to.deep.equal({
        jsxInterpolations: {
          'jsx-0': `true ? \`<Text if=\"true\">\nWith nested if block \${withvar}\n</Text>\` : ''`,
          'jsx-1': `true ? \`<User if=\"true\">\nInner stuff\n\${jsx-0}\nand more\n</User>\` : ''`,
        },
        doc: '${jsx-1}',
      })
    })

    it('should transform document with multiple dynamic nested blocks', () => {
      const glass = `<System>
system prompt
</System>

<User if="true">
Inner stuff
<Text if="true">
With nested if block \${withvar}
</Text>
and more
</User>

<Assistant if="true">
<Text if="false">
do something
</Text>
</Assistant>

<User>
left alone
</User>`

      expect(transformDynamicBlocks(glass)).to.deep.equal({
        jsxInterpolations: {
          'jsx-0': `true ? \`<Text if=\"true\">\nWith nested if block \${withvar}\n</Text>\` : ''`,
          'jsx-1': `true ? \`<User if=\"true\">\nInner stuff\n\${jsx-0}\nand more\n</User>\` : ''`,
          'jsx-2': 'false ? `<Text if="false">\ndo something\n</Text>` : \'\'',
          'jsx-3': 'true ? `<Assistant if="true">\n${jsx-2}\n</Assistant>` : \'\'',
        },
        doc: '<System>\nsystem prompt\n</System>\n\n${jsx-1}\n\n${jsx-3}\n\n<User>\nleft alone\n</User>',
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
