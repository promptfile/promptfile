import { expect } from 'chai'
import { checkOk } from './checkOk'

describe('checkOk', () => {
  it('should not throw on truthy value', () => {
    expect(() => checkOk('hello', 'some error')).to.not.throw()
  })

  it('should throw on falsy value', () => {
    expect(() => checkOk(false, 'some error')).to.throw('some error')
    expect(() => checkOk('', 'some error')).to.throw('some error')
  })
})
