import { expect } from 'chai'

import { parseGlassDocument, reconstructGlassDocument } from './parseGlassBlocks'
import {
  addNodeToDocument,
  replaceDocumentNode,
  replaceStateNode,
  transformGlassDocument,
} from './transformGlassDocument'

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

  it('should parse document nodes and recreate document', () => {
    const doc = `hello world

<Repeat>
<User>
\${input}
</User>

interstitial

<Request model="gpt-4" />
</Repeat>

done`

    expect(reconstructGlassDocument(parseGlassDocument(doc))).to.equal(doc)
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

    expect(replaceDocumentNode('<User>\nuser\n</User>', 0, doc)).to.equal(`<User>
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

  it('should trafnsform document loop', () => {
    const initDocument = `<Repeat>
<User>
\${input}
</User>

<Request model="gpt-4" />
</Repeat>`

    const initInterplatedDoc = `<Repeat>
<User>
hello world
</User>

<Request model="gpt-4" />
</Repeat>`

    const res = transformGlassDocument(initDocument, initInterplatedDoc)

    expect(res.transformedOriginalDoc).to.equal(`<User>
\${input}
</User>

<Request model="gpt-4" />

<Repeat>
<User>
\${input}
</User>

<Request model="gpt-4" />
</Repeat>`)

    expect(res.transformedInterpolatedDoc).to.equal(`<User>
hello world
</User>

<Request model="gpt-4" />

<Repeat>
<User>
\${input}
</User>

<Request model="gpt-4" />
</Repeat>`)
  })

  it('should trafnsform document loop2', () => {
    const initDocument = `<System>
You are a helpful assistant.
</System>

<Repeat>
<User>
\${input}
</User>

<Request model="gpt-3.5-turbo" />
</Repeat>`

    const initInterplatedDoc = `<System>
You are a helpful assistant.
</System>

<Repeat>
<User>
how are you?
</User>

<Request model="gpt-3.5-turbo" />
</Repeat>`

    const res = transformGlassDocument(initDocument, initInterplatedDoc)

    expect(res.transformedOriginalDoc).to.equal(`<System>
You are a helpful assistant.
</System>

<User>
\${input}
</User>

<Request model="gpt-3.5-turbo" />

<Repeat>
<User>
\${input}
</User>

<Request model="gpt-3.5-turbo" />
</Repeat>`)

    expect(res.transformedInterpolatedDoc).to.equal(`<System>
You are a helpful assistant.
</System>

<User>
how are you?
</User>

<Request model="gpt-3.5-turbo" />

<Repeat>
<User>
\${input}
</User>

<Request model="gpt-3.5-turbo" />
</Repeat>`)
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
})
