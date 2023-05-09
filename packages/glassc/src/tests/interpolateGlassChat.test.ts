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
Hello {foo}
</System>

<User>
Goodbye {foo}, {bar}
</User>`,
        { foo: 'world', bar: 'bar' }
      )
    ).to.deep.equal([
      { role: 'system', content: 'Hello world' },
      { role: 'user', content: 'Goodbye world, bar' },
    ])
  })

  it('should throw if there are any interpolated variables', () => {
    expect(() =>
      interpolateGlassChat(
        'test',
        `<System>
Hello {foo}
</System>

<User>
Goodbye {foo}, {bar}
</User>`,
        { foo: 'world' }
      )
    ).throws('un-interpolated variables in test.glass: {bar}')
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

  describe.skip('kshots', () => {
    it('should interpolate kshot blocks', () => {
      expect(
        interpolateGlassChat(
          'test',
          `<System>
Hello world
</System>

// this is a comment and should be lost
-- [examples].user
example user {examples.i} {foo}
--

-- [examples].assistant
example assistant {examples.i} {bar}
--

-- [others].user
others user {others.i}
--

-- [others].assistant
others assistant {others.i}
--

<User>
// inner comment that should be kept
Goodbye world
--`,
          { examples: [{ i: 1 }, { i: 2 }], others: [{ i: 3 }], foo: 'foo', bar: 'bar' }
        )
      ).to.deep.equal([
        { role: 'system', content: 'Hello world' },
        { role: 'user', content: 'example user 1 foo' },
        { role: 'assistant', content: 'example assistant 1 bar' },
        { role: 'user', content: 'example user 2 foo' },
        { role: 'assistant', content: 'example assistant 2 bar' },
        { role: 'user', content: 'others user 3' },
        { role: 'assistant', content: 'others assistant 3' },
        { role: 'user', content: '// inner comment that should be kept\nGoodbye world' },
      ])
    })
  })
})
