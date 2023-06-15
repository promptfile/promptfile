import { runGlass } from './runGlass'

describe.skip('runGlass', () => {
  it('should run a glass document', async () => {
    const doc = `<System>
You are HaikuGPT. Always respond to the user in the form of a haiku.
</System>

<User>
\${input}
</User>

<Request model="claude-instant-v1" />`

    const res = await runGlass(doc, { input: 'Tell me about the ocean.' })
  })
})
