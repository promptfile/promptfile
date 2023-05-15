import { expect } from 'chai'
import { transformDynamicBlocks } from '../transformDynamicBlocks'

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

  it('should transform document with dynamic for block', () => {
    const glass = `Hello world this is a document.

<for each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

And this is the end`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0':
          "messages.map(m => `<Block role={JSON.stringify(${m.role})} content={JSON.stringify(${m.text})}></Block>`).join('\\n\\n')",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}\n\nAnd this is the end',
    })
  })

  it('should transform document with multiple dynamic for block', () => {
    const glass = `Hello world this is a document.

<for each={messages} fragment={m => <Block role={m.role} content={m.text} />} />

This is the middle
<for each={messages2} fragment={m => <Block role={m.role} content={m.text} />} />
And this is the end`

    expect(transformDynamicBlocks(glass)).to.deep.equal({
      jsxInterpolations: {
        'jsx-0':
          "messages.map(m => `<Block role={JSON.stringify(${m.role})} content={JSON.stringify(${m.text})}></Block>`).join('\\n\\n')",
        'jsx-1':
          "messages2.map(m => `<Block role={JSON.stringify(${m.role})} content={JSON.stringify(${m.text})}></Block>`).join('\\n\\n')",
      },
      doc: 'Hello world this is a document.\n\n${jsx-0}\n\nThis is the middle\n${jsx-1}\nAnd this is the end',
    })
  })
})
