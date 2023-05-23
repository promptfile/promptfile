import { expect } from 'chai'
import { loadTestfile } from '../testfiles/loadTestfile'
import { transpileGlassFilePython } from './transpileGlassPython'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'python',
  outputDirectory: '/Users/me/glassc/src',
}

describe('transpileGlassPython', () => {
  it('should transpile without interpolation variables', () => {
    const { input, output } = loadTestfile('basic', 'py')
    const transpiled = transpileGlassFilePython(input, { ...folders, fileName: 'basic' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it.skip('should transpile with get-prefixed named', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
foo
</Prompt>`,
      {
        workspaceFolder: '/Users/me/glassc',
        folderPath: '/Users/me/glassc',
        fileName: 'get-foo',
        language: 'python',
        outputDirectory: '/Users/me/glassc/src',
      }
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""foo""".format()))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile with interpolation variables', () => {
    const { input, output } = loadTestfile('interpolation', 'py')
    const transpiled = transpileGlassFilePython(input, { ...folders, fileName: 'interpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile including interstitial text', () => {
    const { input, output } = loadTestfile('interstitial', 'py')
    const transpiled = transpileGlassFilePython(input, { ...folders, fileName: 'interstitial' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with non-interpolation sequences', () => {
    const { input, output } = loadTestfile('nonInterpolation', 'py')
    const transpiled = transpileGlassFilePython(input, { ...folders, fileName: 'nonInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with multiple interpolation variables', () => {
    const { input, output } = loadTestfile('multipleInterpolation', 'py')
    const transpiled = transpileGlassFilePython(input, { ...folders, fileName: 'multipleInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with duplicate interpolation variables', () => {
    const { input, output } = loadTestfile('duplicateInterpolation', 'py')
    const transpiled = transpileGlassFilePython(input, { ...folders, fileName: 'duplicateInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  // it('should transpile with Args block', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/args')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with code block', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/codeBlock')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with complex code block', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/withImport')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with imports and code interpolations', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/complex')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with dynamic for loop', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/moreFor')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with dynamic for loop', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/forLoop')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single <For> loop', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/forLoopAttributesOnly')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single if condition', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/ifCondition')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single if condition, string value', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/singleIfCondition')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })
})
