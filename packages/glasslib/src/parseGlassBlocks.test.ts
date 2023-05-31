import { expect } from 'chai'
import { parseGlassBlocks, parseGlassBlocksStrict, parseGlassDocument } from './parseGlassBlocks'

describe('parseGlassBlocks', () => {
  it('should parse complex', () => {
    const doc = `<Request model="gpt-4" onResponse={() => setProfile({ hasChatted: true})}>
hello world
</Request>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal('hello world')
  })

  it.only('should parse complex 3', () => {
    const doc = `<For each={[
      { role: 'user', content: 'name an ice cream' },
      { role: "assistant", content: 'Vanilla' },
      { role: 'user', content: 'name a fruit' }
  ]} as="m">
  <Block role={m.role}>
  \${m.content}
  </Block>
  </For>`

    const parsed = parseGlassBlocks(doc)
    console.log(parsed)
    // expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal('hello world')
  })

  it('should parse block', () => {
    const doc = `<Assistant>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal('inside assistant')
  })

  it('should parse multiple block', () => {
    const doc = `<Assistant>
inside assistant
</Assistant>

<User>
inside user
</User>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed).to.have.length(2)
  })

  it('should parse empty block', () => {
    const doc = `<Assistant>
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    // expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal('')
  })

  it('should parse block that doesnt start at beginning of line (except in strict mode', () => {
    const doc = ` <Assistant>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(doc.trim()) // removes newline
    expect(parsed[0].child.content).to.equal('inside assistant')
    const strictParsed = parseGlassBlocksStrict(doc)
    expect(strictParsed).to.deep.equal([])
  })

  it('should parse block with other text', () => {
    const doc = `blah blah blah
aksdjfnasjdkfn

<Assistant>
inside assistant
</Assistant>

outside of block`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(`<Assistant>
inside assistant
</Assistant>`)
    expect(parsed[0].child.content).to.equal('inside assistant')
  })

  it('should parse block with <User> block inside', () => {
    const doc = `<Assistant>
inside assistant
<User>
doSomething
</User>
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed).to.have.length(1) // doesn't parse inner tag
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal(
      `inside assistant
<User>
doSomething
</User>`
    )
  })

  it('should parse block with attributes', () => {
    const doc = `<Assistant foo="bar" if={function doSomething() { return "hello world" }}>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal(`inside assistant`)
    expect(parsed[0].attrs).to.deep.equal([
      {
        name: 'foo',
        stringValue: 'bar',
      },
      {
        name: 'if',
        expressionValue: `function doSomething() { return "hello world" }`,
      },
    ])
  })

  it('should parse block with attributes and invalid jsx inside', () => {
    const doc = `<Assistant foo="bar" if={function doSomething() { return "hello world" }}>
<br>
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal(`<br>`)
    expect(parsed[0].attrs).to.deep.equal([
      {
        name: 'foo',
        stringValue: 'bar',
      },
      {
        name: 'if',
        expressionValue: `function doSomething() { return "hello world" }`,
      },
    ])
  })

  it('should handle self closing tag', () => {
    const doc = `<Assistant model="gpt-4" />`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal(``)
  })

  it('should handle inline tags', () => {
    const doc = `<Assistant>content</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.deep.equal(parseGlassBlocksStrict(doc))
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child.content).to.equal(`content`)
  })

  it('should parse whole document', () => {
    const doc = `const foo = "bar"

<Assistant>
<User>
hello world
</User>
</Assistant>

restOfTheCode()`

    const parsedDoc = parseGlassDocument(doc, false)
    expect(parsedDoc).to.have.length(3)
    expect(parsedDoc[0].content).to.equal('const foo = "bar"\n\n')
    expect(parsedDoc[1].content).to.equal(`<Assistant>
<User>
hello world
</User>
</Assistant>`)
    expect(parsedDoc[2].content).to.equal('\n\nrestOfTheCode()')
  })

  it('should parse whole document with frontmatter', () => {
    const doc = `---
language: typescript
---
const foo = "bar"

<Assistant>
<User>
hello world
</User>
</Assistant>`

    const parsedDoc = parseGlassDocument(doc, false)
    expect(parsedDoc).to.have.length(3)
    expect(parsedDoc[0].content).to.equal(`---
language: typescript
---
`)
    expect(parsedDoc[1].content).to.equal('const foo = "bar"\n\n')
    expect(parsedDoc[2].content).to.equal(`<Assistant>
<User>
hello world
</User>
</Assistant>`)
  })
})
