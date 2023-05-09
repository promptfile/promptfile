import { expect } from 'chai'
import { interpolateGlass } from '../interpolateGlass'

describe('interpolateGlass', () => {
  it('should interpolate an empty document', () => {
    expect(interpolateGlass('test', '', {})).to.equal('')
  })

  it('should interpolate a document with variable', () => {
    expect(interpolateGlass('test', `Hello {foo}`, { foo: 'world' })).to.equal('Hello world')
  })

  it('should interpolate a document with multiple instances of variable', () => {
    expect(interpolateGlass('test', `Hello {foo} {foo}`, { foo: 'world' })).to.equal('Hello world world')
  })

  it('should interpolate a document with multiple variables', () => {
    expect(interpolateGlass('test', `Hello {foo} {bar}`, { foo: 'world', bar: 'bar' })).to.equal('Hello world bar')
  })

  it('should not interpolate similar patterns interpolate a document with multiple instances of variable', () => {
    expect(interpolateGlass('test', `Hello {foo} { foo: "bar" } {foo:bar}`, { foo: 'world' })).to.equal(
      'Hello world { foo: "bar" } {foo:bar}'
    )
  })

  it('should not interpolate prompt with number variables', () => {
    expect(interpolateGlass('test', `Hello {1} {2} {1}`, { 1: 'world', 2: '2' })).to.equal('Hello world 2 world')
  })

  it('should throw if there are any interpolated variables', () => {
    expect(() => interpolateGlass('test', `Hello {foo}`, {})).throws('un-interpolated variables in test.glass: {foo}')
  })
})
