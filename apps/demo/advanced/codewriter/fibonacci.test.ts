import { expect } from 'chai'
import { fibonacci } from './fibonacci'

describe.only('fibonacci', () => {
  it('should return the correct value', () => {
    expect(fibonacci(1)).to.equal(1)
  })
})
