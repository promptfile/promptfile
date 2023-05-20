import { expect } from 'chai'
import { parsePythonLocalVariables, parsePythonUndeclaredSymbols } from './parsePython'

describe('parsePython', () => {
  it('should parse empty doc', () => {
    const code = ``
    expect(parsePythonLocalVariables(code)).to.deep.equal([])
  })

  it('should parse local variables', () => {
    const code = `
foo = 1
bar, baz = 2, 3
def hello():
    return "world"
`
    expect(parsePythonLocalVariables(code)).to.deep.equal(['foo', 'bar', 'baz', 'hello'])
  })

  it('should parse local variables with function containing arg', () => {
    const code = `
foo = 1
bar, baz = 2, 3
def hello(b):
    return "world" + b
`
    expect(parsePythonLocalVariables(code)).to.deep.equal(['foo', 'bar', 'baz', 'hello'])
  })

  it('Variables with different scopes: Only variables in the global scope should be returned.', () => {
    const code = `
a = 1
def f():
    b = 2
`
    expect(parsePythonLocalVariables(code)).to.deep.equal(['a', 'f'])
  })

  it.skip('Variables defined in a loop: The loop variable should be returned.', () => {
    const code = `
for i in range(10):
    pass
`
    expect(parsePythonLocalVariables(code)).to.deep.equal([])
  })

  it('Variables defined in a loop: The loop variable should be returned.', () => {
    const code = `
def f():
    return 1
a = f()
`
    expect(parsePythonLocalVariables(code)).to.deep.equal(['f', 'a'])
  })

  it('Multiple function definitions: All function names should be returned.', () => {
    const code = `
def f():
    return 1
def g():
    return 2
`
    expect(parsePythonLocalVariables(code)).to.deep.equal(['f', 'g'])
  })

  it('Variables assigned within an if-else block:', () => {
    const code = `
if True:
    a = 1
else:
    b = 2
`
    expect(parsePythonLocalVariables(code)).to.deep.equal(['a', 'b'])
  })

  it('should parse undeclared symbols when there are none', () => {
    const code = `
foo = 1
bar, baz = 2, 3
def hello():
    return "world"
`
    expect(parsePythonUndeclaredSymbols(code)).to.deep.equal([])
  })

  it('should parse undeclared symbols when there are some', () => {
    const code = `
foo = a
bar, baz = 2, 3
def hello():
    return c
`
    expect(parsePythonUndeclaredSymbols(code)).to.deep.equal(['a', 'c'])
  })

  it('should parse undeclared symbols there is just one variable', () => {
    const code = `a`
    expect(parsePythonUndeclaredSymbols(code)).to.deep.equal(['a'])
  })

  it('should parse undeclared symbols there is just one variable with property access', () => {
    const code = `a.foo`
    expect(parsePythonUndeclaredSymbols(code)).to.deep.equal(['a'])
  })

  it('should parse undeclared symbols there is just one variable with property access', () => {
    const code = `a[foo]`
    expect(parsePythonUndeclaredSymbols(code)).to.deep.equal(['a', 'foo'])
  })
})
