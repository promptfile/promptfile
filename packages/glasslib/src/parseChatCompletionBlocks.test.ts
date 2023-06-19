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
        `<System>
Hello world
</System>

<Transcript>
<User>
1
</User>

<User>
2
</User>

<User>
3
</User>
</Transcript>

<User>
Goodbye world 2
</User>`,
        [],
        {
          countTokens: () => 1,
          maxTokens: () => 2,
          reserveCount: 1,
        }
      )
    ).to.deep.equal([
      [
        { role: 'system', name: undefined, content: 'Hello world' },
        { role: 'user', name: undefined, content: '3' },
        { role: 'user', name: undefined, content: 'Goodbye world 2' },
      ],
    ])
  })
})
