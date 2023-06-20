import { expect } from 'chai'
import { runGlass } from './runGlass'

describe.skip('runGlass', () => {
  it('should run a glass document', async () => {
    const doc = `<System>
You are HaikuGPT. Always respond to the user in the form of a haiku.
</System>

<User>
@{input}
</User>

<Request model="gpt-3.5-turbo" />`
    let id = 0
    const res = await runGlass(doc, { input: 'Tell me about the ocean.' }, { id: () => ++id + '' })
    expect(res.response).to.deep.equal([{}])
  })
})
