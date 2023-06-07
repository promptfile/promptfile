import { expect } from 'chai'
import { fibonacci } from './fibonacci'

describe.only('fibonacci', () => {
  it('fibonacci(1)', () => {
    expect(fibonacci(1)).to.equal(1)
  })

  it('fibonacci(2)', () => {
    expect(fibonacci(2)).to.equal(1)
  })

  it('fibonacci(3)', () => {
    expect(fibonacci(3)).to.equal(2)
  })
})
