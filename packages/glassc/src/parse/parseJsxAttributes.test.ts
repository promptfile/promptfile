import { expect } from 'chai'
import { parseJsxAttributes } from './parseJsxAttributes'

describe('parseJsxAttributes', () => {
  it('should parse attributes', () => {
    const code = `<Args foo="bar" hello="world" />`
    expect(parseJsxAttributes(code)).to.deep.equal({
      foo: 'bar',
      hello: 'world',
    })
  })
})
