import { expect } from 'chai'
import { parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'
import { addNodeToDocument, handleRequestNode, replaceDocumentNode, replaceStateNode } from './transformGlassDocument'

describe('transformGlassDocument', () => {
  it('should parse document nodes and recreate document', () => {
    const doc = `---
language: typescript
---
hello world`

    expect(reconstructGlassDocument(parseGlassDocument(doc))).to.equal(doc)
    expect(parseGlassDocument(doc)).to.have.length(1)
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
    expect(reconstructGlassDocument(parseGlassDocument(doc))).to.equal(doc)
    expect(parseGlassDocument(doc)).to.have.length(5)
  })

  it('should parse document nodes and recreate document', () => {
    const doc = `---
language: typescript
---
hello world`

    expect(reconstructGlassDocument(parseGlassDocument(doc))).to.equal(doc)
    expect(parseGlassDocument(doc)).to.have.length(1)
  })

  //   it('should parse document nodes and recreate document', () => {
  //     const doc = `hello world

  // <Repeat>
  // <User>
  // \${input}
  // </User>

  // interstitial

  // <Request model="gpt-4" />
  // </Repeat>

  // done`

  //     expect(reconstructGlassDocument(parseGlassDocument(doc))).to.equal(doc)
  //   })

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

    expect(replaceDocumentNode('<User>\nuser\n</User>\n\n', 1, doc)).to.equal(`---
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

    it('should transform document with existing state node', () => {
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

  describe('handleRequestNode', () => {
    it('shoudl handle request without transcript', () => {
      const origDoc = `---
language: typescript
---

<User>
\${input}
</User>

<Request model="gpt-4" />`

      const interpDoc = `---
language: typescript
---

<User>
hello world
</User>

<Request model="gpt-4" />`

      const res = handleRequestNode(origDoc, interpDoc, { message: '', streaming: true, model: 'gpt-4' })
      expect(res.rawResponse).to.equal('█')
      expect(res.finalDoc).to.equal(`---
language: typescript
---

<Transcript>
<User>
hello world
</User>

<Assistant model="gpt-4" temperature="1">
█
</Assistant>
</Transcript>

<User>
\${input}
</User>

<Request model="gpt-4" />`)
    })

    it('shoudl handle request with empty transcript', () => {
      const origDoc = `<User>
\${input}
</User>

<Transcript />

<Request model="gpt-4" />`

      const interpDoc = `<User>
hello world
</User>

<Transcript />

<Request model="gpt-4" />`

      const res = handleRequestNode(origDoc, interpDoc, { message: '', streaming: true, model: 'gpt-4' })
      expect(res.rawResponse).to.equal('█')
      expect(res.finalDoc).to.equal(`<User>
\${input}
</User>

<Transcript>
<User>
hello world
</User>

<Assistant model="gpt-4" temperature="1">
█
</Assistant>
</Transcript>

<Request model="gpt-4" />`)
    })

    it('shoudl handle request with transcript', () => {
      const origDoc = `<Transcript>
<User>
hello world
</User>

<Assistant model="gpt-4" temperature="1">
how are you doing?
</Assistant>
</Transcript>

<User>
\${input}
</User>

<Request model="gpt-4" />`

      const interpDoc = `<Transcript>
<User>
hello world
</User>

<Assistant model="gpt-4" temperature="1">
how are you doing?
</Assistant>
</Transcript>

<User>
goodbye world
</User>

<Request model="gpt-4" />`

      const res = handleRequestNode(origDoc, interpDoc, { message: '', streaming: true, model: 'gpt-4' })
      expect(res.rawResponse).to.equal('█')
      expect(res.finalDoc).to.equal(`<Transcript>
<User>
hello world
</User>

<Assistant model="gpt-4" temperature="1">
how are you doing?
</Assistant>

<User>
goodbye world
</User>

<Assistant model="gpt-4" temperature="1">
█
</Assistant>
</Transcript>

<User>
\${input}
</User>

<Request model="gpt-4" />`)
    })
  })
})
