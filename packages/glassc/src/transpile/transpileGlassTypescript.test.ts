import { expect } from 'chai'
import { loadTestFile } from '../util/loadTestfile'
import { transpileGlassFileTypescript } from './transpileGlassTypescript'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'typescript',
  outputDirectory: '/Users/me/glassc/src',
}

describe('transpileGlassTypescript', () => {
  it('should transpile with non-interpolation sequences', () => {
    const { input, output } = loadTestFile('testfiles/ts/nonInterpolationSequence', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'nonInterpolationSequence' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with multiple interpolation variables', () => {
    const { input, output } = loadTestFile('testfiles/ts/multipleInterpolation', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'multipleInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with Args block', () => {
    const { input, output } = loadTestFile('testfiles/ts/args', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'args' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with code block', () => {
    const { input, output } = loadTestFile('testfiles/ts/codeBlock', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'codeBlock' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with complex code block', () => {
    const { input, output } = loadTestFile('testfiles/ts/withImport', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'withImport' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with imports and code interpolations', () => {
    const { input, output } = loadTestFile('testfiles/ts/complex', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'complex' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadTestFile('testfiles/ts/forLoop', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'forLoop' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with single if condition', () => {
    const { input, output } = loadTestFile('testfiles/ts/ifCondition', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'ifCondition' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with special characters', () => {
    const { input, output } = loadTestFile('testfiles/ts/specialCharacters', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'specialCharacters' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it.skip('should transpile with .prompt import', () => {
    const { input, output } = loadTestFile('testfiles/ts/glassImport', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'glassImport' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })
})
