import { expect } from 'chai'
import { parsePyCode } from './parsePyCode'

describe('parsePyCode', () => {
  it('should parse empty block', async () => {
    const res = await parsePyCode(``)
    expect(res.symbolsAddedToScope).to.have.length(0)
    expect(res.undeclaredValuesNeededInScope).to.have.length(0)
  })

  it('should parse code block', async () => {
    const res = await parsePyCode(`
x = 5
y = x + z
def foo(bar):
    str = f'hello {boogy}'
    return bar + baz
`)
    expect(res.symbolsAddedToScope).to.include('x')
    expect(res.symbolsAddedToScope).to.include('y')
    expect(res.symbolsAddedToScope).to.include('foo')
    expect(res.symbolsAddedToScope).to.have.length(3)

    expect(res.undeclaredValuesNeededInScope).to.include('baz')
    expect(res.undeclaredValuesNeededInScope).to.include('z')
    expect(res.undeclaredValuesNeededInScope).to.include('boogy')
    expect(res.undeclaredValuesNeededInScope).to.have.length(3)
  })

  it('should parse code block with imports', async () => {
    const res = await parsePyCode(`
import requests

x = requests.get('http://google.com')
y.map(lambda z: z + 1)
`)
    expect(res.symbolsAddedToScope).to.include('x')
    expect(res.symbolsAddedToScope).to.include('requests')
    expect(res.symbolsAddedToScope).to.have.length(2)
    expect(res.undeclaredValuesNeededInScope).to.include('y')
    expect(res.undeclaredValuesNeededInScope).to.have.length(1)
  })
})
