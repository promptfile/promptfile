import { expect } from 'chai'
import { loadFixtureNext } from '../fixtures/loadFixture'
import { transpileGlassFileNext } from './transpileGlassNext'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'typescript',
  outputDirectory: '/Users/me/glassc/src',
}

describe('transpileGlassNext', () => {
  it('should transpile without interpolation variables', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/noInterpolation')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  //   it('should transpile with get-prefixed named', () => {
  //     const transpiled = transpileGlassFileNext(
  //       `<Prompt>
  // foo
  // </Prompt>`,
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
  //   const TEMPLATE = \`<Prompt>
  // foo
  // </Prompt>\`
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
    const { input, output } = loadFixtureNext('transpileGlassNext/withInterpolation')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile including interstitial text', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/interstitialText')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it.skip('should transpile into javascript', () => {
    const transpiled = transpileGlassFileNext(
      `<Prompt>
\${foo}
</Prompt>`,
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
  const TEMPLATE = \`<Prompt>
\${foo}
</Prompt>\`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}`)
  })

  it('should transpile with non-interpolation sequences', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/nonInterpolationSequence')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with multiple interpolation variables', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/multipleInterpolation')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with duplicate interpolation variables', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/duplicateInterpolation')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with Args block', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/args')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with code block', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/codeBlock')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with code block containing state', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/codeBlockWithState')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with complex code block', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/withImport')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with imports and code interpolations', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/complex')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/moreFor')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/forLoop')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with single <For> loop', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/forLoopAttributesOnly')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with single if condition', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/ifCondition')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with single if condition, string value', () => {
    const { input, output } = loadFixtureNext('transpileGlassNext/singleIfCondition')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })
})
