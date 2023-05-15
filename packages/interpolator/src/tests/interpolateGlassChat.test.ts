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

  it('should interpolate dynamic blocks', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
You are a helpful assistant.
</System>

\${jsx-0}

<Assistant>
goodbye world
</Assistant>`,
        { 'jsx-0': '<User>\nhello world\n</User>' }
      )
    ).to.deep.equal([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'hello world' },
      { role: 'assistant', content: 'goodbye world' },
    ])
  })

  it('should interpolate dynamic blocks with expressions', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
You are a helpful assistant.
</System>

\${jsx-0}

<Assistant>
goodbye world
</Assistant>`,
        { 'jsx-0': '<User name={"username"}>\nhello world\n</User>' }
      )
    ).to.deep.equal([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'hello world' },
      { role: 'assistant', content: 'goodbye world' },
    ])
  })

  it.skip('should interpolate dynamic blocks with if condition', () => {
    expect(
      interpolateGlassChat(
        'test',
        `<System>
You are a helpful assistant.
</System>

\${jsx-0}

<Assistant>
goodbye world
</Assistant>`,
        { 'jsx-0': '<User if={false}>\nhello world\n</User>' }
      )
    ).to.deep.equal([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'assistant', content: 'goodbye world' },
    ])
  })
})
