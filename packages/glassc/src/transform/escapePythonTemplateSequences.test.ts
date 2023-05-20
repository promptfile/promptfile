import { expect } from 'chai'
import { escapePythonTemplateSequences } from './escapePythonTemplateSequences'

describe('escapePythonTemplateSequences', () => {
  it('should leave string unmodified', () => {
    expect(escapePythonTemplateSequences('Hello world')).to.equal('Hello world')
  })

  it('should leave empty template sequence unmodified', () => {
    expect(escapePythonTemplateSequences('Hello {}')).to.equal('Hello {}')
  })

  it('should escape non-empty template sequences', () => {
    expect(escapePythonTemplateSequences('Hello {} {world}')).to.equal('Hello {} {{world}}')
  })

  it('should escape nested sequences', () => {
    expect(escapePythonTemplateSequences('Hello { foo: { baz: bar} } {}')).to.equal('Hello {{ foo: {{ baz: bar}} }} {}')
  })

  it('should escape empty template sequence nested inside other template sequence', () => {
    expect(escapePythonTemplateSequences('Hello { foo: {} } {}')).to.equal('Hello {{ foo: {{}} }} {}')
  })
})
