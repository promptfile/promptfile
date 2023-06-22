import { expect } from 'chai'
import { parseGlassBlocks, parseGlassDocument } from './parseGlassBlocks'

describe('parseGlassBlocks', () => {
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
      '<Assistant>\ninside assistant\n</Assistant>'
    )
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '<User>\ninside user\n</User>'
    )
    expect(parsed[1].child!.content).to.equal('inside user')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal(
      'inside user'
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
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal(expected)
    expect(parsed[0].child!.content).to.equal('inside assistant')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      'inside assistant'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '<User>\ninside user\n</User>'
    )
    expect(parsed[1].child!.content).to.equal('inside user')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal(
      'inside user'
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
      'inside assistant'
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
      'inside assistant'
    )
  })

  it('should parse with self-closing element', () => {
    const doc = `<Assistant />

<User />`

    const parsed = parseGlassBlocks(doc)
    expect(parsed).to.have.length(2)
    expect(parsed[0].tag).to.equal('Assistant')
    expect(parsed[0].content).to.equal(`<Assistant />`)
    expect(doc.substring(parsed[0].position.start.offset, parsed[0].position.end.offset)).to.equal('<Assistant />')
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
      '<User>\ninside user\n</User>'
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
      '<Assistant>\n<Assistant>\ninside assistant\n</Assistant>\n</Assistant>'
    )
    expect(parsed[0].child!.content).to.equal('<Assistant>\ninside assistant\n</Assistant>')
    expect(doc.substring(parsed[0].child!.position.start.offset, parsed[0].child!.position.end.offset)).to.equal(
      '<Assistant>\ninside assistant\n</Assistant>'
    )

    expect(parsed[1].tag).to.equal('User')
    expect(parsed[1].content).to.equal('<User>\n</foo>\n<Foo/>\n<User>\ninside user\n</User>\n</User>')
    expect(doc.substring(parsed[1].position.start.offset, parsed[1].position.end.offset)).to.equal(
      '<User>\n</foo>\n<Foo/>\n<User>\ninside user\n</User>\n</User>'
    )
    expect(parsed[1].child!.content).to.equal('</foo>\n<Foo/>\n<User>\ninside user\n</User>')
    expect(doc.substring(parsed[1].child!.position.start.offset, parsed[1].child!.position.end.offset)).to.equal(
      '</foo>\n<Foo/>\n<User>\ninside user\n</User>'
    )
  })

  it('should parse complex', () => {
    const doc = `<Request model="gpt-4" onResponse={() => setProfile({ hasChatted: true})}>
hello world
</Request>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('hello world')
  })

  it('should parse complex with nesting', () => {
    const doc = `<For each={[
    { role: 'user', content: 'name an ice cream' },
    { role: "assistant", content: 'Vanilla' },
    { role: 'user', content: 'name a fruit' }
]} as="m">
<Block role={m.role}>
@{m.content}
</Block>
</For>`

    const parsed = parseGlassBlocks(doc)
    expect(parsed[0].content).to.equal(doc)
    expect(parsed[0].child!.content).to.equal('<Block role={m.role}>\n@{m.content}\n</Block>')
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

  it('should parse document with no blocks', () => {
    const doc = `const foo = "bar"
`

    const parsedDoc = parseGlassDocument(doc)
    expect(parsedDoc).to.have.length(1)
    expect(parsedDoc[0].content).to.equal('const foo = "bar"\n')
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

  it('should parse glass blocks stress', () => {
    const doc =
      '---\nlanguage: typescript\n---\n\n// This is a prompt that can be used by people working on Promptfile to launch conversations with GPT-4, directly from VSCode.\n\nconst timestamp = new Date().toISOString()\n\n<System>\nYou are ChatGPT, and you are assisting the User inside of VSCode. The User is working in the `promptfile` repository, which provides language support for the Promptfile (`.prompt` extension) DSL. The `promptfile` repository is primarily written in TypeScript and contains a language server, VSCode extension, compiler, and more.\n\nGlass is a declarative framework for prompting large language models. It allows developers to create scripts to launch interactions with large language models that are more dynamic and rich than pure strings alone. This is becuase Promptfile allows developers to run code to dynamically construct and insert data into a prompt.\n\nFor reference, here\'s an example Promptfile file:\n\n````prompt\n// this is typescript code that will be executed by the glass runtime.\n\n<System>\nthis is a system prompt. it is given markdown syntax highlighting.\n</System>\n\n<User>\nthis is a user prompt, which is also given markdown syntax highlighting.\n</User>\n\n// this next element will send a request to the GPT-3.5 Turbo model with two prompt blocks:\n// 1. the system prompt\n// 2. the user prompt\n// the result will be an Asssitant element that will be inserted into the document.\n<Request model="gpt-3.5-turbo" />\n````\n\n\nThe current time is ${timestamp}.\n</System>\n\n<Transcript>\n<User>\ni\'d like to write a typescript function that can parse a document like the following:\n\n```\nconst foo = "bar"\n// other typescript code\n\n<JsxElement foo="bar">\ninside element\n</JSXElement>\n```\n\nI\'m interested in retriving all JsxElement blocks. In particular, these elements MUST\n- start at the beginning of a line\n- start with <TagName ...\n- may possibly include attributes like `foo="bar"` or `foo={"bar"}`, and these attributes may be multiline\n- must close on a newline, e.g. `</TagName>`, though they may also be self closing (in which case the close MUST happen at the end of the line, with no characters following\n\nwrite me a function `parseJSXElementBlocks(str: string)` which returns a list if strings which are the JSX elements. Implement this by first splitting the document into lines, iterate over the lines, and use a regular expression to determine the beginning/end of a JSX element.\n</User>\n\n<Assistant model="gpt-4" temperature={1} requestTokens={519} responseTokens={389} cost="$0.03891">\nTo achieve this, you can write a TypeScript function that splits the document into lines and then iterates over the lines using a regular expression to determine the beginning and end of JSX elements. Here\'s an implementation of the `parseJSXElementBlocks` function:\n\n```typescript\nfunction parseJSXElementBlocks(str: string): string[] {\n  const lines = str.split(\'\n\');\n  const jsxElements: string[] = [];\n  let currentElement: string | null = null;\n\n  const openingTagRegex = /^<([a-zA-Z]+)([sS]*?)(/>)?$/;\n  const closingTagRegex = /^</([a-zA-Z]+)>$/;\n\n  for (const line of lines) {\n    const openingMatch = line.match(openingTagRegex);\n\n    if (openingMatch) {\n      if (currentElement === null) {\n        currentElement = line + \'\n\';\n        if (openingMatch[3]) {\n          // If it\'s a self-closing element, add it to the list and reset currentElement\n          jsxElements.push(currentElement);\n          currentElement = null;\n        }\n      } else {\n        // If an opening tag is encountered within an existing element, just append the line\n        currentElement += line + \'\n\';\n      }\n    } else {\n      if (currentElement !== null) {\n        // If there is an existing JSX element, append the line\n        currentElement += line + \'\n\';\n\n        // Check for closing tag\n        const closingMatch = line.match(closingTagRegex);\n        if (closingMatch) {\n          jsxElements.push(currentElement);\n          currentElement = null;\n        }\n      }\n    }\n  }\n\n  return jsxElements;\n}\n```\n\nThis function will return an array of strings, where each string represents a JSX element block found in the input string.\n</Assistant>\n\n<User>\ngreat thanks! can you write tests for that?\n</User>\n\n<Assistant model="gpt-4" temperature={1} requestTokens={926} cost="$0.02778">\nSure, here are some example test cases using Node.js built-in `assert` module for testing the `parseJSXElementBlocks` function. \n\nCreate a new TypeScript file for tests, e.g., `parseJSXElementBlocks.test.ts`, and paste the following code:\n\n```typescript\nimport { parseJSXElementBlocks } from \'./parseJSXElementBlocks\'; // Make sure to update the import statement with the correct file path\nimport * as assert from \'assert\';\n\nfunction testParseJSXElementBlocks() {\n  // Test single line elements\n  const testString1 = `\nconst foo = "bar";\n\n<SingleLineElement />\nconst bar = "baz";\n`;\n  const expected1 = [\'<SingleLineElement />\n\'];\n  assert.deepStrictEqual(parseJSXElementBlocks(testString1), expected1);\n\n  // Test multiline elements\n  const testString2 = `\nconst x = 42;\n\n<MultiLineElement foo="bar">\n  Inside element\n</MultiLineElement>\n\nconst y = 24;\n`;\n  const expected2 = [\'<MultiLineElement foo="bar">\n  Inside element\n</MultiLineElement>\n\'];\n  assert.deepStrictEqual(parseJSX█\n</Assistant>\n</Transcript>\n\n<User>\n${input}\n</User>\n\n<Request model="gpt-4" />'
    expect(() => parseGlassBlocks(doc)).to.not.throw()
  })
})
