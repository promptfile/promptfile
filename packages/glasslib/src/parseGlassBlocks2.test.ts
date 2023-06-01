import { expect } from 'chai'
import { parseGlassBlocks } from './parseGlassBlocks2'

describe('parseGlassBlocks2', () => {
  it('should parse basic', () => {
    const doc = `<Assistant>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(doc)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(doc)
    expect(parsed[0].child.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child.position.start.offset, parsed[0].child.position.end.offset)).to.equal(
      'inside assistant'
    )
  })

  it('should parse multiple blocks', () => {
    const doc = `<Assistant>
inside assistant
</Assistant>

<User>
inside user
</User>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.have.length(2)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal('<Assistant>\ninside assistant\n</Assistant>')
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(
      '<Assistant>\ninside assistant\n</Assistant>\n'
    )
    expect(parsed[0].child.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child.position.start.offset, parsed[0].child.position.end.offset)).to.equal(
      'inside assistant\n'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '\n<User>\ninside user\n</User>'
    )
    expect(parsed[1].child.content).to.equal('inside user')
    expect(doc.substring(parsed[1].child.position.start.offset, parsed[1].child.position.end.offset)).to.equal(
      '\ninside user'
    )
  })

  it.only('should ignore code', () => {
    const doc = `hello world
<Assistant>
inside assistant
</Assistant>`

    const expected = `<Assistant>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(expected)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(expected)
    // expect(parsed[0].child.content).to.equal('inside assistant')
    // expect(doc.substring(parsed[0].child.position.start.offset, parsed[0].child.position.end.offset)).to.equal(
    //   'inside assistant'
    // )
  })
})
