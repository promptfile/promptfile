import { expect } from 'chai'
import { removeEscapedHtml, restoreEscapedHtml } from './escapeHtml'

describe('escapeHtml', () => {
  it('should remove escapedHtml sequences', () => {
    const mdx = `
foo bar

asdfasf

<Element>
<Text escapeHtml>
literal insides
</Text>
</Element>

<Text escapeHtml="true">
more literal insides
</Text>`

    const replaced = removeEscapedHtml(mdx)

    expect(replaced).to.deep.equal({
      output: `
foo bar

asdfasf

<Element>
<Text escapeHtml>GLASS_LITERAL_1</Text>
</Element>

<Text escapeHtml="true">GLASS_LITERAL_2</Text>`,
      replacements: {
        GLASS_LITERAL_1: '\nliteral insides\n',
        GLASS_LITERAL_2: '\nmore literal insides\n',
      },
    })

    expect(restoreEscapedHtml(replaced.output, replaced.replacements)).to.equal(mdx)
  })
})
