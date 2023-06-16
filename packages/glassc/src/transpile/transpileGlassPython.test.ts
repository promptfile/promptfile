import { expect } from 'chai'
import { loadTestFile } from '../util/loadTestfile'
import { transpileGlassFilePython } from './transpileGlassPython'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'python',
  outputDirectory: '/Users/me/glassc/src',
}

describe.skip('transpileGlassPython', () => {
  it('should transpile without interpolation variables', async () => {
    const { input, output } = loadTestFile('testfiles/py/basic', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'basic' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with literal sequence', async () => {
    const { input, output } = loadTestFile('testfiles/py/literal', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'literal' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it.skip('should transpile with get-prefixed named', async () => {
    const transpiled = await transpileGlassFilePython(
      `<User>
foo
</User>`,
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
        0: """{}""".format("""<User>
{}
</User>""".format("""foo""".format()))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile with interpolation variables', async () => {
    const { input, output } = loadTestFile('testfiles/py/interpolation', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'interpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile including interstitial text', async () => {
    const { input, output } = loadTestFile('testfiles/py/interstitial', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'interstitial' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with non-interpolation sequences', async () => {
    const { input, output } = loadTestFile('testfiles/py/nonInterpolation', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'nonInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with multiple interpolation variables', async () => {
    const { input, output } = loadTestFile('testfiles/py/multipleInterpolation', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'multipleInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with duplicate interpolation variables', async () => {
    const { input, output } = loadTestFile('testfiles/py/duplicateInterpolation', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'duplicateInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it.skip('should transpile with testblock', async () => {
    const { input, output } = loadTestFile('testfiles/py/testblock', 'py')
    const transpiled = await transpileGlassFilePython(input, { ...folders, fileName: 'testblock' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  // it('should transpile with Args block', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/args')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with code block', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/codeBlock')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with complex code block', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/withImport')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with imports and code interpolations', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/complex')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with dynamic for loop', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/moreFor')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with dynamic for loop', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/forLoop')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single <For> loop', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/forLoopAttributesOnly')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single if condition', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/ifCondition')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single if condition, string value', () => {
  //   const { input, output } = loadFixture('transpileGlassTypescript/singleIfCondition')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })
})
