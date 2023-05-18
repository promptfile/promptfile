import { expect } from 'chai'
import { interpolateGlass } from './interpolateGlass'

describe('interpolateGlass', () => {
  it('should interpolate an empty document', () => {
    expect(
      interpolateGlass(
        'test',
        `<Prompt>
</Prompt>`,
        {}
      )
    ).to.equal('')
  })

  it('should interpolate a document with variable', () => {
    expect(
      interpolateGlass(
        'test',
        `<Prompt>
Hello \${foo}
</Prompt>`,
        { foo: 'world' }
      )
    ).to.equal('Hello world')
  })

  it('should interpolate a document with multiple instances of variable', () => {
    expect(
      interpolateGlass(
        'test',
        `<Prompt>
Hello \${foo} \${foo}
</Prompt>`,
        { foo: 'world' }
      )
    ).to.equal('Hello world world')
  })

  it('should interpolate a document with multiple variables', () => {
    expect(
      interpolateGlass(
        'test',
        `<Prompt>
Hello \${foo} \${bar}
</Prompt>`,
        { foo: 'world', bar: 'bar' }
      )
    ).to.equal('Hello world bar')
  })

  it('should not interpolate similar patterns interpolate a document with multiple instances of variable', () => {
    expect(
      interpolateGlass(
        'test',
        `<Prompt>
Hello \${foo} { foo: "bar" } {foo}
</Prompt>`,
        { foo: 'world' }
      )
    ).to.equal('Hello world { foo: "bar" } {foo}')
  })

  it('should interpolate prompt with number variables', () => {
    expect(
      interpolateGlass(
        'test',
        `<Prompt>
Hello \${1} \${2} \${1}
</Prompt>`,
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

<Prompt>
Hello world
</Prompt>`,
        {}
      )
    ).to.equal('Hello world')
  })

  it('should throw if there are any interpolated variables', () => {
    expect(() =>
      interpolateGlass(
        'test',
        `<Prompt>
Hello \${foo}
</Prompt>`,
        {}
      )
    ).throws('un-interpolated variables in test.glass: ${foo}')
  })

  it('should throw if there are no prompt blocks', () => {
    expect(() => interpolateGlass('test', `missing prompt blocks`, {})).throws(
      'expected exactly one <Prompt> block in test.glass (got 0)'
    )
  })

  it('should throw if there is more than one prompt blocks', () => {
    expect(() =>
      interpolateGlass(
        'test',
        `<Prompt>
prompt block 1
</Prompt>

<Prompt>
prompt block 2
</Prompt>`,
        {}
      )
    ).throws('expected exactly one <Prompt> block in test.glass (got 2)')
  })
})
