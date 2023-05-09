import { expect } from 'chai'
import { parseGlassBlocks } from '../parseGlassBlocks'

describe('parseGlassBlocks', () => {
  it('should parse empty document', () => {
    expect(parseGlassBlocks('')).to.deep.equal([])
  })

  it('should parse normal blocks', () => {
    expect(
      parseGlassBlocks(`<System>
Hello world
</System>

<User>
Goodbye world
</User>`)
    ).to.deep.equal([
      {
        role: 'system',
        content: 'Hello world',
      },
      {
        role: 'user',
        content: 'Goodbye world',
      },
    ])
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
        role: 'system',
        content: 'Hello world',
      },
      {
        role: '[examples].user',
        content: 'example user {examples.i}',
      },
      {
        role: '[examples].assistant',
        content: 'example assistant {examples.i}',
      },
      {
        role: 'user',
        content: 'Goodbye world',
      },
    ])
  })
})
