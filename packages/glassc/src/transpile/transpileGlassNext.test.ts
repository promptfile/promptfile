import { expect } from 'chai'
import { loadTestfile } from '../testfiles/loadTestfile'
import { transpileGlassFileNext } from './transpileGlassNext'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'typescript',
  outputDirectory: '/Users/me/glassc/src',
}

describe('transpileGlassTypescript', () => {
  it('should transpile without interpolation variables', () => {
    const { input, output } = loadTestfile('noInterpolation', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'noInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  //   it('should transpile with get-prefixed named', () => {
  //     const transpiled = transpileGlassFileNext(
  //       `<User>
  // foo
  // </User>`,
  //       {
  //         workspaceFolder: '/Users/me/glassc',
  //         folderPath: '/Users/me/glassc',
  //         fileName: 'get-foo',
  //         language: 'typescript',
  //         outputDirectory: '/Users/me/glassc/src',
  //       }
  //     )

  //     expect(transpiled.code).to.equal(`export async function getFooPrompt(opt?: {
  //   options?: { openaiKey?: string, progress?: (data: { nextDoc: string; rawResponse?: string }) => void },
  // }) {
  //   const GLASS_STATE = {}

  //   const GLASSVAR = {}
  //   const TEMPLATE = \`<User>
  // foo
  // </User>\`
  //   return await runGlass(
  //     'get-foo',
  //     'text-davinci-003',
  //     { interpolatedDoc: TEMPLATE, originalDoc },
  //     {
  //       ...(opt?.options || {}),
  //       ...{ state: GLASS_STATE, onResponse: undefined },
  //     }
  //   )
  // }`)
  //   })

  it('should transpile with interpolation variables', () => {
    const { input, output } = loadTestfile('withInterpolation', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'withInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile including interstitial text', () => {
    const { input, output } = loadTestfile('interstitialCode', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'interstitialCode' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it.skip('should transpile into javascript', () => {
    const transpiled = transpileGlassFileNext(
      `<User>
\${foo}
</User>`,
      {
        workspaceFolder: '/Users/me/glassc',
        folderPath: '/Users/me/glassc',
        fileName: 'foo',
        language: 'javascript',
        outputDirectory: '/Users/me/glassc/src',
      }
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt) {
  opt = opt || {}
  const GLASS_STATE = {}
  const { foo } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = \`<User>
\${foo}
</User>\`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}`)
  })

  it('should transpile with non-interpolation sequences', () => {
    const { input, output } = loadTestfile('nonInterpolationSequence', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'nonInterpolationSequence' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with multiple interpolation variables', () => {
    const { input, output } = loadTestfile('multipleInterpolation', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'multipleInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with duplicate interpolation variables', () => {
    const { input, output } = loadTestfile('duplicateInterpolation', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'duplicateInterpolation' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with Args block', () => {
    const { input, output } = loadTestfile('args', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'args' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with code block', () => {
    const { input, output } = loadTestfile('codeBlock', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'codeBlock' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with code block containing state', () => {
    const { input, output } = loadTestfile('codeBlockWithState', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'codeBlockWithState' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with complex code block', () => {
    const { input, output } = loadTestfile('withImport', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'withImport' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with imports and code interpolations', () => {
    const { input, output } = loadTestfile('complex', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'complex' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadTestfile('moreFor', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'moreFor' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadTestfile('forLoop', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'forLoop' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  // it('should transpile with single <For> loop', () => {
  //   const { input, output } = loadTestfile('forLoopAttributesOnly', 'ts')
  //   const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'forLoopAttributesOnly' })
  //   expect(transpiled.code.trim()).to.equal(output.trim())
  // })

  it('should transpile with single if condition', () => {
    const { input, output } = loadTestfile('ifCondition', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'ifCondition' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with single if condition, string value', () => {
    const { input, output } = loadTestfile('singleIfCondition', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'singleIfCondition' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it('should transpile with special characters', () => {
    const { input, output } = loadTestfile('specialCharacters', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'specialCharacters' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })

  it.skip('should transpile with .glass import', () => {
    const { input, output } = loadTestfile('glassImport', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'glassImport' })
    expect(transpiled.code.trim()).to.equal(output.trim())
  })
})
