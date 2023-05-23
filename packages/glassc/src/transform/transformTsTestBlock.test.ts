import { expect } from 'chai'
import { transformTsTestBlock } from './transformTsTestBlock'

describe('transformTsTestBlock', () => {
  it('should do transformation without return statement', () => {
    const code = `const url = "https://elliottburris.com"
const question = "where did elliott go to school"
`
    expect(transformTsTestBlock(code)).to.equal(`function getTestData() {
  const url = 'https://elliottburris.com'
  const question = 'where did elliott go to school'

  return { url, question }
}
`)
  })

  it('should do transformation with return statement', () => {
    const code = `const url = "https://elliottburris.com"
const question = "where did elliott go to school"
return [{ foo: "bar"}]
`
    expect(transformTsTestBlock(code)).to.equal(`function getTestData() {
  const url = 'https://elliottburris.com'
  const question = 'where did elliott go to school'
  return [{ foo: 'bar' }].map(glass_example => ({ ...{ url, question }, ...glass_example }))
}
`)
  })
})
