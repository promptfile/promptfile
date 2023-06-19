import { expect } from 'chai'
import { parseInterpolations } from './parseInterpolations'

describe('parseInterpolations', () => {
  it('it should parse string without interpolations', () => {
    const parsed = parseInterpolations('hello world')
    expect(parsed).to.deep.equal([])
  })

  it('it should parse string with single interpolation', () => {
    const parsed = parseInterpolations(`hello world @{foo}`)
    expect(parsed).to.deep.equal(['@{foo}'])
  })

  it('it should parse string with multiple interpolation', () => {
    const parsed = parseInterpolations(`hello world @{foo}
@{bar}`)
    expect(parsed).to.deep.equal(['@{foo}', '@{bar}'])
  })

  it('it should parse string with multiline interpolation', () => {
    const parsed = parseInterpolations(`hello world @{
  foo
}`)
    expect(parsed).to.deep.equal(['@{\n  foo\n}'])
  })

  it('it should parse string with interpolation containing {}', () => {
    const parsed = parseInterpolations(`hello world @{function() { return 'foo' }}`)
    expect(parsed).to.deep.equal(["@{function() { return 'foo' }}"])
  })
})
