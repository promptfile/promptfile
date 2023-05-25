import { expect } from 'chai'
import { replaceLiterals, restoreLiterals } from './replaceLiterals'

describe('replaceLiterals', () => {
  it('should replace literals', () => {
    const mdx = `
foo bar

asdfasf

<Element>
<Literal>
literal insides
</Literal>
</Element>

<Literal>
more literal insides
</Literal>`

    const replaced = replaceLiterals(mdx)

    expect(replaced).to.deep.equal({
      output: `
foo bar

asdfasf

<Element>
GLASS_LITERAL_1
</Element>

GLASS_LITERAL_2`,
      replacements: {
        GLASS_LITERAL_1: '\nliteral insides\n',
        GLASS_LITERAL_2: '\nmore literal insides\n',
      },
    })

    expect(restoreLiterals(replaced.output, replaced.replacements)).to.equal(mdx)
  })
})
