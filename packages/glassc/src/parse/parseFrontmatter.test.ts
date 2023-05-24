import { expect } from 'chai'
import { parseFrontmatter } from './parseFrontmatter'

describe('parseFrontmatter', () => {
  it('should parse frontmatter with language', () => {
    expect(
      parseFrontmatter(`---
language: typescript
---`)
    ).to.deep.equal({ language: 'typescript' })
  })

  it('should parse frontmatter with args', () => {
    expect(
      parseFrontmatter(`---
args:
  foo: bar
  baz: "{ foo: string, bar: string }"
---`)
    ).to.deep.equal({ args: { foo: 'bar', baz: '{ foo: string, bar: string }' } })
  })

  it('should parse frontmatter', () => {
    expect(
      parseFrontmatter(`---
language: typescript
args:
  foo: bar
  baz: "{ foo: string, bar: string }"
---`)
    ).to.deep.equal({ language: 'typescript', args: { foo: 'bar', baz: '{ foo: string, bar: string }' } })
  })

  it('should parse frontmatter (yaml only)', () => {
    expect(
      parseFrontmatter(`language: typescript
args:
  foo: bar
  baz: "{ foo: string, bar: string }"
`)
    ).to.deep.equal({ language: 'typescript', args: { foo: 'bar', baz: '{ foo: string, bar: string }' } })
  })
})
