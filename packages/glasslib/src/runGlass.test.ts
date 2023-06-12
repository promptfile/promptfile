import { expect } from 'chai'
import { runGlassV2 } from './runGlassV2'

describe.skip('runGlass', () => {
  it('should run a glass document', async () => {
    const doc = `<System>
You are HaikuGPT. Always respond to the user in the form of a haiku.
</System>

<User>
\${input}
</User>

<Request model="claude-instant-v1" />`

    const res = await runGlassV2(doc, { input: 'Tell me about the ocean.' })
    expect(res.initInterpolatedDoc).to.equal(doc.replace('${input}', 'Tell me about the ocean.'))
  })
})
