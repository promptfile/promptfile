import { expect } from 'chai'
import { removeGlassFrontmatter } from './removeGlassFrontmatter'

describe('removeGlassFrontmatter', () => {
  it('should remove frontmatter', () => {
    const mdx = `---
arg: foo
otherArg: bar
---
Hello world`

    expect(removeGlassFrontmatter(mdx)).to.equal(`Hello world`)
  })

  it('should remove frontmatter and preserve starting newlines', () => {
    const mdx = `---
arg: foo
otherArg: bar
---


Hello world`

    expect(removeGlassFrontmatter(mdx)).to.equal(`\n\nHello world`)
  })

  it('should ignore block that doesnt begin the document', () => {
    const mdx = `frontmatter ignored
---
arg: foo
otherArg: bar
---`

    expect(removeGlassFrontmatter(mdx)).to.equal(`frontmatter ignored
---
arg: foo
otherArg: bar
---`)
  })
})
