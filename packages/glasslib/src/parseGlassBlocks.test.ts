import { expect } from 'chai'
import { parseGlassBlocks, parseGlassBlocksRecursive, parseGlassDocument } from './parseGlassBlocks'

describe('parseGlassBlocks', () => {
  it('should parse complex', () => {
    const doc = `<Request model="gpt-4" onResponse={() => setProfile({ hasChatted: true})}>
hello world
</Request>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('hello world')
  })

  it('should parse complex 3', () => {
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
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('<Block role={m.role}>\n${m.content}\n</Block>')
  })

  it('should parse empty block', () => {
    const doc = `<Assistant>
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('')
  })

  it('should parse block with other text', () => {
    const doc = `blah blah blah
aksdjfnasjdkfn

<Assistant>
inside assistant
</Assistant>

outside of block`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(`<Assistant>
inside assistant
</Assistant>`)
    expect(parsed[0].child!.content).to.equal('inside assistant')
  })

  it('should parse block with <User> block inside', () => {
    const doc = `<Assistant>
inside assistant
<User>
doSomething
</User>
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.have.length(1) // doesn't parse inner tag
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal(
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
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal(`inside assistant`)
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
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal(`<br>`)
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
    expect(parsed[0].child!.content).to.equal(``)
  })

  it('should parse whole document', () => {
    const doc = `const foo = "bar"

<Assistant>
<User>
hello world
</User>
</Assistant>

restOfTheCode()`

    const parsedDoc = parseGlassDocument(doc)
    expect(parsedDoc).to.have.length(3)
    expect(parsedDoc[0].content).to.equal('const foo = "bar"\n\n')
    expect(parsedDoc[1].content).to.equal(`<Assistant>
<User>
hello world
</User>
</Assistant>`)
    expect(parsedDoc[2].content).to.equal('\nrestOfTheCode()')
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

    const parsedDoc = parseGlassDocument(doc)
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

  it('should parse basic', () => {
    const doc = `<Assistant>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(doc)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant\n'
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
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant\n'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '<User>\ninside user\n</User>'
    )
    expect(parsed[1].child!.content).to.equal('inside user')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal(
      'inside user\n'
    )
  })

  it('should ignore code', () => {
    const doc = `hello world
<Assistant>
inside assistant
</Assistant>

more interstitial code

<User>
inside user
</User>`

    const expected = `<Assistant>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)

    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(expected)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(expected + '\n')
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant\n'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '<User>\ninside user\n</User>'
    )
    expect(parsed[1].child!.content).to.equal('inside user')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal(
      'inside user\n'
    )
  })

  it('should parse with attributes', () => {
    const doc = `<Assistant foo="bar" baz={() => "hello"} >
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(doc)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant\n'
    )
  })

  it('should parse with multiline start', () => {
    const doc = `<Assistant
    foo="bar"
    baz={() => "hello"}
>
inside assistant
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(doc)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant\n'
    )
  })

  it('should parse with self-closing element', () => {
    const doc = `<Assistant />

<User />`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.have.length(2)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(`<Assistant />`)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal('<Assistant />\n')
    expect(parsed[0].child!.content).to.equal('')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal('')

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User />')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal('<User />')
    expect(parsed[1].child!.content).to.equal('')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal('')
  })

  it('should parse with nested elements', () => {
    const doc = `<Assistant>
<User>
inside user
</User>
</Assistant>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.have.length(1)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(doc)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('<User>\ninside user\n</User>')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      '<User>\ninside user\n</User>\n'
    )
  })

  it('should parse with nested elements stress', () => {
    const doc = `<Assistant>
<Assistant>
inside assistant
</Assistant>
</Assistant>

<User>
</foo>
<Foo/>
<User>
inside user
</User>
</User>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.have.length(2)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal('<Assistant>\n<Assistant>\ninside assistant\n</Assistant>\n</Assistant>')
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(
      '<Assistant>\n<Assistant>\ninside assistant\n</Assistant>\n</Assistant>\n'
    )
    expect(parsed[0].child!.content).to.equal('<Assistant>\ninside assistant\n</Assistant>')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      '<Assistant>\ninside assistant\n</Assistant>\n'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\n</foo>\n<Foo/>\n<User>\ninside user\n</User>\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '<User>\n</foo>\n<Foo/>\n<User>\ninside user\n</User>\n</User>'
    )
    expect(parsed[1].child!.content).to.equal('</foo>\n<Foo/>\n<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal(
      '</foo>\n<Foo/>\n<User>\ninside user\n</User>\n'
    )
  })

  it('should parse recursive blocks', () => {
    const doc = `<Assistant>
inside me
<User>
ignore
</User>
</Assistant>

<Repeat>
<Request mode="gpt-4" />
</Repeat>`

    const parsed = parseGlassBlocksRecursive(doc)
    expect(parsed).to.have.length(3)
    expect(parsed[2].tag).to.equal('Request')
    expect(parsed[2].content).to.equal('<Request mode="gpt-4" />')
    expect(parsed[2].child!.content).to.equal('')
  })
})
