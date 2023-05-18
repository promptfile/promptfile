import { expect } from 'chai'
import { transformJsxExpressionToTemplateString } from './transformJsxExpressionToTemplateString'

describe('transformJsxExpressionToTemplateString', () => {
  it('should transform simple JSX arrow expression to template string', () => {
    const code = `m => <Block foo="bar" role={m.role} content={m.text} />`
    const templateString = transformJsxExpressionToTemplateString(code)
    expect(templateString).to.equal(
      'm => `<Block foo="bar" role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n</Block>`'
    )
  })

  it('should transform nested JSX arrow expression to template string', () => {
    const code = `m => <Block role={m.role} content={m.text}><Child foo={m.bar} /></Block>`
    const templateString = transformJsxExpressionToTemplateString(code)
    expect(templateString).to.equal(
      'm => `<Block role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n<Child foo={${JSON.stringify(m.bar)}}>\n</Child>\n</Block>`'
    )
  })
})
