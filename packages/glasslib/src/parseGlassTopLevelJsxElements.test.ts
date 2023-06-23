import { expect } from 'chai'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

describe('parseGlassTopLevelJsxElements', () => {
  it('should parse glass document with commented out nodes', () => {
    const mdx = `// <System>
// hello world
//</System>`

    expect(parseGlassTopLevelJsxElements(mdx)).to.deep.equal([])
  })

  it('should parse glass document with commented out insides', () => {
    const mdx = `<System>
// hello world
</System>`

    expect(parseGlassTopLevelJsxElements(mdx)).to.have.length(1)
  })

  it('should parse glass document with nested elements', () => {
    const mdx = `<System>
<User>
hello
</User>
</System>`

    expect(parseGlassTopLevelJsxElements(mdx)).to.have.length(1)
  })

  it('should succeed wehn there is a JSX element with attribute and no value', () => {
    expect(() =>
      parseGlassTopLevelJsxElements(`<System foo>
asdofin
</System>`)
    ).to.not.throw('')
  })
})
