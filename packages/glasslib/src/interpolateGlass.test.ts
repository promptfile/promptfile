import { expect } from 'chai'
import { interpolateGlass } from './interpolateGlass'

describe('interpolateGlass', () => {
  it('should interpolate an empty document', () => {
    expect(
      interpolateGlass(
        'test',
        `<User>
</User>`,
        {}
      )
    ).to.equal('')
  })

  it('should interpolate a document with variable', () => {
    expect(
      interpolateGlass(
        'test',
        `<User>
Hello \${foo}
</User>`,
        { foo: 'world' }
      )
    ).to.equal('Hello world')
  })

  it('should interpolate a document with multiple instances of variable', () => {
    expect(
      interpolateGlass(
        'test',
        `<User>
Hello \${foo} \${foo}
</User>`,
        { foo: 'world' }
      )
    ).to.equal('Hello world world')
  })

  it('should interpolate a document with multiple variables', () => {
    expect(
      interpolateGlass(
        'test',
        `<User>
Hello \${foo} \${bar}
</User>`,
        { foo: 'world', bar: 'bar' }
      )
    ).to.equal('Hello world bar')
  })

  it('should not interpolate similar patterns interpolate a document with multiple instances of variable', () => {
    expect(
      interpolateGlass(
        'test',
        `<User>
Hello \${foo} { foo: "bar" } {foo}
</User>`,
        { foo: 'world' }
      )
    ).to.equal('Hello world { foo: "bar" } {foo}')
  })

  it('should interpolate prompt with number variables', () => {
    expect(
      interpolateGlass(
        'test',
        `<User>
Hello \${1} \${2} \${1}
</User>`,
        { 1: 'world', 2: '2' }
      )
    ).to.equal('Hello world 2 world')
  })

  it('should ignore non-prompt blocks and interstitial space', () => {
    expect(
      interpolateGlass(
        'test',
        `<Code>
ignore me
</Code>

also ignore me

<User>
Hello world
</User>`,
        {}
      )
    ).to.equal('Hello world')
  })

  it('should throw if there are any interpolated variables', () => {
    expect(() =>
      interpolateGlass(
        'test',
        `<User>
Hello \${foo}
</User>`,
        {}
      )
    ).throws('un-interpolated variables in test.glass: ${foo}')
  })

  it('should throw if there are no prompt blocks', () => {
    expect(() => interpolateGlass('test', `missing prompt blocks`, {})).throws(
      'expected exactly one <User> block in test.glass (got 0)'
    )
  })

  it('should throw if there is more than one prompt blocks', () => {
    expect(() =>
      interpolateGlass(
        'test',
        `<User>
prompt block 1
</User>

<User>
prompt block 2
</User>`,
        {}
      )
    ).throws('expected exactly one <User> block in test.glass (got 2)')
  })
})
