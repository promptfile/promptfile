import { expect } from 'chai'
import { removeGlassComments } from '../removeGlassComments'

describe('removeGlassComments', () => {
  it('should remove line comments', () => {
    const mdx = `Hello
{/* comment */}
world`

    expect(removeGlassComments(mdx)).to.equal(`Hello\nworld`)
  })

  it('should remove multiple line comments', () => {
    const mdx = `Hello
{/* comment */}
{  /* comment2 */  }
world`

    expect(removeGlassComments(mdx)).to.equal(`Hello\nworld`)
  })

  it('should remove a multi-line comment', () => {
    const mdx = `Hello
{/*
  comment
*/}
world`

    expect(removeGlassComments(mdx)).to.equal(`Hello\nworld`)
  })

  it('should remove comment at start of document', () => {
    const mdx = `{/* comment */}
Hello
world`

    expect(removeGlassComments(mdx)).to.equal(`Hello\nworld`)
  })

  it('should remove comment at end of document', () => {
    const mdx = `Hello
world
{/* comment */}`

    expect(removeGlassComments(mdx)).to.equal(`Hello\nworld`)
  })

  it('should remove inline comment', () => {
    const mdx = `Hello{/* comment */} world`
    expect(removeGlassComments(mdx)).to.equal(`Hello world`)
  })

  it('should remove multiple inline comments', () => {
    const mdx = `Hello{/* comment */} world {/* comment2 */}`
    expect(removeGlassComments(mdx)).to.equal(`Hello world `)
  })

  it('should remove inline multi-line comments', () => {
    const mdx = `Hello{/* comment
more comment*/} world`
    expect(removeGlassComments(mdx)).to.equal(`Hello world`)
  })

  it('should preserve appropriate newlines', () => {
    const mdx = `{/* comment */}

Hello

{/* comment */}

world
{/* comment */}`
    expect(removeGlassComments(mdx)).to.equal(`\nHello\n\n\nworld`)
  })
})
