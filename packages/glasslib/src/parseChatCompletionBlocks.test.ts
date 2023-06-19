import { expect } from 'chai'
import { parseChatCompletionBlocks, parseChatCompletionBlocks2 } from './parseChatCompletionBlocks'

describe('parseChatCompletionBlocks', () => {
  it('should parse empty document', () => {
    expect(parseChatCompletionBlocks('')).to.deep.equal([])
  })

  it('should interpolate a document with system block', () => {
    expect(
      parseChatCompletionBlocks(
        `<System>
Hello world
</System>`
      )
    ).to.deep.equal([{ role: 'system', name: undefined, content: 'Hello world' }])
  })

  it('should interpolate a document with system and user block', () => {
    expect(
      parseChatCompletionBlocks(
        `<System>
Hello world
</System>

<User>
Goodbye world
</User>`
      )
    ).to.deep.equal([
      { role: 'system', name: undefined, content: 'Hello world' },
      { role: 'user', name: undefined, content: 'Goodbye world' },
    ])
  })

  it('should interpolate a document with <Block>', () => {
    expect(
      parseChatCompletionBlocks(
        `<Block role="System">
Hello world
</Block>

<Block role="user" content={"Goodbye world"}>
</Block>`
      )
    ).to.deep.equal([
      { role: 'system', name: undefined, content: 'Hello world' },
      { role: 'user', name: undefined, content: 'Goodbye world' },
    ])
  })

  it('should ignore comments', () => {
    expect(
      parseChatCompletionBlocks(
        `// this is a comment
<System>
Hello world
@{/* this is also a comment */}
</System>

ignore me

<User>
Goodbye world
</User>`
      )
    ).to.deep.equal([
      { role: 'system', name: undefined, content: 'Hello world' },
      { role: 'user', name: undefined, content: 'Goodbye world' },
    ])
  })

  it('should ignore interstitial text', () => {
    expect(
      parseChatCompletionBlocks(
        `<System>
Hello world
</System>

ignore me
// also ignore me

<User>
Goodbye world
</User>`
      )
    ).to.deep.equal([
      { role: 'system', name: undefined, content: 'Hello world' },
      { role: 'user', name: undefined, content: 'Goodbye world' },
    ])
  })

  it('should ignore test blocks', () => {
    expect(
      parseChatCompletionBlocks(
        `<System>
Hello world
</System>

<Test>
ignore me
</Test>

<User>
Goodbye world
</User>`
      )
    ).to.deep.equal([
      { role: 'system', name: undefined, content: 'Hello world' },
      { role: 'user', name: undefined, content: 'Goodbye world' },
    ])
  })

  //   it('should ignore loop blocks', () => {
  //     expect(
  //       parseChatCompletionBlocks(
  //         `<System>
  // Hello world
  // </System>

  // <Repeat>
  // <User>
  // Goodbye world
  // </User>
  // </Repeat>`
  //       )
  //     ).to.deep.equal([{ role: 'system', content: 'Hello world' }])
  //   })

  it('should parse chat completion blocks with token counter', () => {
    expect(
      parseChatCompletionBlocks2(
        `<User>
1
</User>

<User>
2
</User>

<User>
3
</User>

<Request model="gpt-3.5-turbo" />`,
        [
          {
            model: 'gpt-3.5-turbo',
          },
        ],
        {
          countTokens: () => 1,
          maxTokens: () => Infinity,
          reserveCount: 1,
        }
      )
    ).to.deep.equal([
      [
        { role: 'user', name: undefined, content: '1' },
        { role: 'user', name: undefined, content: '2' },
        { role: 'user', name: undefined, content: '3' },
      ],
    ])
  })

  it('should parse chat completion blocks with token counter, complex', () => {
    expect(
      parseChatCompletionBlocks2(
        `<User>
1
</User>

<User>
2
</User>

<User>
3
</User>

<Request model="gpt-3.5-turbo" />`,
        [
          {
            model: 'gpt-3.5-turbo',
          },
        ],
        {
          countTokens: () => 1,
          maxTokens: () => 4,
          reserveCount: 2,
        }
      )
    ).to.deep.equal([
      [
        { role: 'user', name: undefined, content: '2' },
        { role: 'user', name: undefined, content: '3' },
      ],
    ])
  })
})
