import { expect } from 'chai'

import { parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'
import { addNodeToDocument, replaceDocumentNode, replaceStateNode } from './transformGlassDocument'

describe('transformGlassDocument', () => {
  it('should parse document nodes and recreate document', () => {
    const doc = `---
language: typescript
---
hello world`

    expect(reconstructGlassDocument(parseGlassDocument(doc, false))).to.equal(doc)
    expect(parseGlassDocument(doc, false)).to.have.length(1)
  })

  it('should count toplevel nodes correctly and replace document', () => {
    const doc = `<Assistant>
bar
</Assistant>

<User>
world
</User>

<Assistant>
world
</Assistant>`
    expect(reconstructGlassDocument(parseGlassDocument(doc, false))).to.equal(doc)
    expect(parseGlassDocument(doc, false)).to.have.length(5)
  })

  it('should parse document nodes and recreate document', () => {
    const doc = `---
language: typescript
---
hello world`

    expect(reconstructGlassDocument(parseGlassDocument(doc, false))).to.equal(doc)
    expect(parseGlassDocument(doc, false)).to.have.length(1)
  })

  it('should parse document nodes and recreate document', () => {
    const doc = `hello world

<Loop>
<User>
\${input}
</User>

interstitial

<Request model="gpt-4" />
</Loop>

done`

    expect(reconstructGlassDocument(parseGlassDocument(doc, false))).to.equal(doc)
  })

  it('should add node to document', () => {
    const doc = `---
language: typescript
---
hello world`

    expect(addNodeToDocument('<User>\nuser\n</User>\n', 0, doc)).to.equal(`<User>
user
</User>
---
language: typescript
---
hello world`)

    expect(addNodeToDocument('\n<User>\nuser\n</User>', 1, doc)).to.equal(`---
language: typescript
---
hello world
<User>
user
</User>`)
  })

  it('should replace document node', () => {
    const doc = `---
language: typescript
---
hello world

<User />`

    expect(replaceDocumentNode('<User>\nuser\n</User>\n', 0, doc)).to.equal(`<User>
user
</User>
hello world

<User />`)

    expect(replaceDocumentNode('<User>\nuser\n</User>\n', 1, doc)).to.equal(`---
language: typescript
---
<User>
user
</User>
<User />`)
  })

  describe('replaceStateNode', () => {
    it('should transform document with frontmatter', () => {
      const newState = `<State>\nstate\n</State>`

      const doc = `---
langauge: typescript
---

const a = "foo"

<User>
hello
</User>`

      expect(replaceStateNode(newState, doc)).to.equal(`---
langauge: typescript
---

<State>
state
</State>

const a = "foo"

<User>
hello
</User>`)
    })

    it('should transform document without frontmatter', () => {
      const newState = '<State>\nstate\n</State>'

      const doc = `const a = "foo"

<User>
hello
</User>`

      expect(replaceStateNode(newState, doc)).to.equal(`<State>
state
</State>

const a = "foo"

<User>
hello
</User>`)
    })

    it('should transform document without existing state node', () => {
      const newState = `<State>\nstate\n</State>`

      const doc = `const a = "foo"

<State>
foo
</State>

<User>
hello
</User>`

      expect(replaceStateNode(newState, doc)).to.equal(`const a = "foo"

<State>
state
</State>

<User>
hello
</User>`)
    })
  })
})
