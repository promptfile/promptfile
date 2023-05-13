import { expect } from 'chai'
import { interpolateGlassChat } from '../interpolateGlassChat'

describe('interpolateGlassChat', () => {
  it('should interpolate an empty document', () => {
    expect(interpolateGlassChat('test', '', {})).to.deep.equal([])
  })

  it('should interpolate a document with system block', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
Hello world
</System>`,
        {}
      )
    ).to.deep.equal([{ role: 'system', content: 'Hello world' }])
  })

  it('should interpolate a document with system and user block', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
Hello world
</System>

<User>
Goodbye world
</User>`,
        {}
      )
    ).to.deep.equal([
      { role: 'system', content: 'Hello world' },
      { role: 'user', content: 'Goodbye world' },
    ])
  })

  it('should interpolate a document with system and user block and variables', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
Hello \${foo}
</System>

<User>
Goodbye \${foo}, \${bar}
</User>`,
        { foo: 'world', bar: 'bar' }
      )
    ).to.deep.equal([
      { role: 'system', content: 'Hello world' },
      { role: 'user', content: 'Goodbye world, bar' },
    ])
  })

  it('should ignore comments', () => {
    expect(
      interpolateGlassChat(
        'test',
        `// this is a comment
<System>
Hello world
{/* this is also a comment */}
</System>

ignore me

<User>
Goodbye world
</User>`,
        {}
      )
    ).to.deep.equal([
      { role: 'system', content: 'Hello world' },
      { role: 'user', content: 'Goodbye world' },
    ])
  })

  it('should ignore interstitial text', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
Hello world
</System>

ignore me
// also ignore me

<User>
Goodbye world
</User>`,
        {}
      )
    ).to.deep.equal([
      { role: 'system', content: 'Hello world' },
      { role: 'user', content: 'Goodbye world' },
    ])
  })

  it('should ignore code blocks', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
Hello world
</System>

<Code>
ignore me
</Code>

<User>
Goodbye world
</User>`,
        {}
      )
    ).to.deep.equal([
      { role: 'system', content: 'Hello world' },
      { role: 'user', content: 'Goodbye world' },
    ])
  })

  it('should throw if there are any interpolated variables', () => {
    expect(() =>
      interpolateGlassChat(
        'test',
        `<System>
Hello \${foo}
</System>

<User>
Goodbye \${foo}, \${bar}
</User>`,
        { foo: 'world' }
      )
    ).throws('un-interpolated variables in test.glass: ${bar}')
  })
})
