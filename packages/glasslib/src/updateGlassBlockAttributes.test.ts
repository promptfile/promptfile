import { expect } from 'chai'
import { parseGlassBlocks } from './parseGlassBlocks'
import { updateGlassBlockAttributes } from './updateGlassBlockAttributes'

describe('updateGlassBlockAttributes', () => {
  it('should update to include id', () => {
    const doc = `<System hello="world" foo={bar}>
blah blah
</System>`

    const blocks = parseGlassBlocks(doc)
    const newBlock = updateGlassBlockAttributes(blocks[0], { name: 'id', expressionValue: BigInt(1).toString() })

    expect(newBlock).to.equal(`<System hello="world" foo={bar} id={1}>
blah blah
</System>`)
  })
})
