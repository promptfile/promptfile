import { expect } from 'chai'
import { parseGlassBlocks } from '../parseGlassBlocks'

describe('parseGlassBlocks', () => {
  it('should parse empty document', () => {
    expect(parseGlassBlocks('')).to.deep.equal([])
  })

  it('should parse empty block', () => {
    expect(
      parseGlassBlocks(`<System>
</System>`)
    ).to.deep.equal([{ tag: 'System', content: '' }])
  })

  it('should parse normal blocks', () => {
    expect(
      parseGlassBlocks(`<System>
Hello world
</System>

<User>
Goodbye world
</User>

<Code>


code
</Code>

<Assistant>

assistant

</Assistant>`)
    ).to.deep.equal([
      {
        tag: 'System',
        content: 'Hello world',
      },
      {
        tag: 'User',
        content: 'Goodbye world',
      },
      {
        tag: 'Code',
        content: '\n\ncode',
      },
      {
        tag: 'Assistant',
        content: '\nassistant\n',
      },
    ])
  })

  it('should ignore interstitial space', () => {
    expect(
      parseGlassBlocks(`ignore me
<System>
Hello world
</System>

ignore me too

<User>
Goodbye world
</User>`)
    ).to.deep.equal([
      {
        tag: 'System',
        content: 'Hello world',
      },
      {
        tag: 'User',
        content: 'Goodbye world',
      },
    ])
  })

  it('should parse tags', () => {
    expect(
      parseGlassBlocks(`<User name="foo" bar="baz">
Goodbye world
</User>`)
    ).to.deep.equal([
      {
        tag: 'User',
        content: 'Goodbye world',
        attrs: {
          name: 'foo',
          bar: 'baz',
        },
      },
    ])
  })

  it('should throw exception on unbalanced closing tag', () => {
    expect(() =>
      parseGlassBlocks(`</System>
<User>
Goodbye world
</User>`)
    ).to.throw('Unbalanced closing tag </System> (line 1)')
  })

  it('should throw exception on nested tags', () => {
    expect(() =>
      parseGlassBlocks(`<System>
hello world
<User>
Goodbye world
</User>`)
    ).to.throw('Must complete tag <System> (line 1) before starting tag <User> (line 3)')
  })

  it.skip('should parse kshot blocks', () => {
    expect(
      parseGlassBlocks(`-- system
Hello world
--

-- [examples].user
example user {examples.i}
--

-- [examples].assistant
example assistant {examples.i}
--

-- user
Goodbye world
--`)
    ).to.deep.equal([
      {
        tag: 'System',
        content: 'Hello world',
      },
      {
        tag: '[examples].user',
        content: 'example user {examples.i}',
      },
      {
        tag: '[examples].assistant',
        content: 'example assistant {examples.i}',
      },
      {
        tag: 'User',
        content: 'Goodbye world',
      },
    ])
  })
})
