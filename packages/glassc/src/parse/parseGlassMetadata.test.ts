import { expect } from 'chai'
import { parseGlassMetadata, parseGlassMetadataPython } from './parseGlassMetadata'

describe('parseGlassMetadata', () => {
  it('should parse non-chat document with no vars', () => {
    expect(
      parseGlassMetadata(`<User>
hello world
</User>`)
    ).to.deep.equal({ interpolationVariables: [] })
  })

  it('should parse chat document with no vars', () => {
    expect(
      parseGlassMetadata(`<System>
hello world
</System>`)
    ).to.deep.equal({ interpolationVariables: [] })
  })

  it('should parse non-chat document with vars', () => {
    expect(
      parseGlassMetadata(`<User>
@{foo}
</User>`)
    ).to.deep.equal({ interpolationVariables: ['foo'] })
  })

  it('should parse chat document with vars', () => {
    expect(
      parseGlassMetadata(`<Init>
import {hello} from './world'
const a = await fetch(url)
const text = await a.text()
</Init>

<System>
@{foo}
</System>

<User>
@{bar}
</User>

<Assistant>
@{foo}
</Assistant>`)
    ).to.deep.equal({ interpolationVariables: ['foo', 'bar', 'url'] })
  })

  it('should parse another', () => {
    expect(
      parseGlassMetadata(`<Init>
import fs from 'fs'
import path from 'path'
import { vectorSearch } from './vectorSearch'

const sotu = fs.readFileSync(path.join(__dirname, 'state_of_the_union.txt'), 'utf-8')
const lines = sotu.split('\\n').filter(line => Boolean(line))
const question = "What kept us apart last year?"
const context = await vectorSearch('sotu', lines, question)
</Init>

<System>
Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
</System>

<User>
@{context.join('\\n\\n')}

Question: @{question}
Helpful Answer:
</User>

<Request model="gpt-3.5-turbo" />`)
    ).to.deep.equal({ interpolationVariables: [] })
  })

  it('should parse another glass document', () => {
    expect(
      parseGlassMetadata(`<For each={[
    { role: 'user', content: 'name an ice cream' },
    { role: "assistant", content: 'Vanilla' },
    { role: 'user', content: 'name a fruit' }
]} as="m">
<Block role={m.role}>
@{content}
</Block>
</For>`)
    ).to.deep.equal({ interpolationVariables: ['content'] })
  })

  it('should parse another glass document', () => {
    expect(
      parseGlassMetadata(`<For each={[
    { role: 'user', content: 'name an ice cream' },
    { role: "assistant", content: 'Vanilla' },
    { role: 'user', content: 'name a fruit' }
]} as="m">
<Block role={m.role}>
@{m.content}
</Block>
</For>`)
    ).to.deep.equal({ interpolationVariables: [] })
  })

  describe('parseGlassMetadataPython', () => {
    it('should parse non-chat document with no vars', async () => {
      expect(
        await parseGlassMetadataPython(`<User>
hello world
</User>`)
      ).to.deep.equal({ interpolationVariables: [] })
    })

    it('should parse chat document with no vars', async () => {
      expect(
        await parseGlassMetadataPython(`<System>
hello world
</System>`)
      ).to.deep.equal({ interpolationVariables: [] })
    })

    it('should parse non-chat document with vars', async () => {
      expect(
        await parseGlassMetadataPython(`<User>
@{foo}
</User>`)
      ).to.deep.equal({ interpolationVariables: ['foo'] })
    })

    it('should parse chat document with vars', async () => {
      expect(
        (
          await parseGlassMetadataPython(`<Init>
import requests
a = requests.get(url)
text = a.text()
</Init>

<System>
@{foo}
</System>

<User>
@{bar}
</User>

<Assistant>
@{foo}
</Assistant>`)
        ).interpolationVariables
      ).to.have.members(['foo', 'bar', 'url'])
    })

    it('should parse another glass document', async () => {
      expect(
        await parseGlassMetadataPython(`<For each={[
    { role: 'user', content: 'name an ice cream' },
    { role: "assistant", content: 'Vanilla' },
    { role: 'user', content: 'name a fruit' }
]} as="m">
<Block role={m.role}>
@{content}
</Block>
</For>`)
      ).to.deep.equal({ interpolationVariables: ['content'] })
    })

    it('should parse another glass document', async () => {
      expect(
        await parseGlassMetadataPython(`<For each={[
    { role: 'user', content: 'name an ice cream' },
    { role: "assistant", content: 'Vanilla' },
    { role: 'user', content: 'name a fruit' }
]} as="m">
<Block role={m.role}>
@{m.content}
</Block>
</For>`)
      ).to.deep.equal({ interpolationVariables: [] })
    })
  })
})
