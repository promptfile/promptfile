import { expect } from 'chai'
import { addChatBlock, addChatBlocks } from './addChatBlocks'
import { initGlass } from './initGlass'

describe('addChatBlocks', () => {
  it('should construct glass file', () => {
    const glassfile = initGlass('gpt-3.5-turbo')
    expect(glassfile).to.equal(`---
model: gpt-3.5-turbo
---`)

    const glassfile2 = initGlass('gpt-3.5-turbo', {
      role: 'user',
      content: 'hello world',
    })
    expect(glassfile2).to.equal(`---
model: gpt-3.5-turbo
---

<User>
hello world
</User>`)
  })
  it('should add a chat block', () => {
    const glassfile = `---
language: typescript
---

<User>
user
</User>`

    const newDoc = addChatBlock(glassfile, {
      role: 'system',
      content: 'hello world',
      name: 'test',
    })

    expect(newDoc).to.equal(`${glassfile}

<System name="test">
hello world
</System>`)
  })

  it('should add a chat blocks', () => {
    const glassfile = `---
language: typescript
---

<User>
user
</User>`

    const newDoc = addChatBlocks(glassfile, [
      {
        role: 'system',
        content: 'hello world',
        name: 'test',
      },
      {
        role: 'user',
        content: 'goodbye world',
        type: 'function_call',
      },
    ])

    expect(newDoc).to.equal(`${glassfile}

<System name="test">
hello world
</System>

<User type="function_call">
goodbye world
</User>`)
  })
})
