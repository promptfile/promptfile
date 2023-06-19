import { expect } from 'chai'
import { addChatBlocks } from './addChatBlocks'

describe('addChatBlocks', () => {
  it('should add a chat block', () => {
    const glassfile = `---
language: typescript
---

<User>
user
</User>`

    const newDoc = addChatBlocks(glassfile, {
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

    const newDoc = addChatBlocks(
      glassfile,
      {
        role: 'system',
        content: 'hello world',
        name: 'test',
      },
      {
        role: 'user',
        content: 'goodbye world',
        type: 'function_call',
      }
    )

    expect(newDoc).to.equal(`${glassfile}

<System name="test">
hello world
</System>

<User type="function_call">
goodbye world
</User>`)
  })
})
