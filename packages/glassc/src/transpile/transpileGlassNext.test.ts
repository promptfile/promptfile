import { expect } from 'chai'
import { loadFixture } from '../fixtures/loadFixture'
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
    const transpiled = transpileGlassFileNext(
      `<Prompt>
foo
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt?: {
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}

  const GLASSVAR = {}
  const TEMPLATE = \`<Prompt>
foo
</Prompt>\`
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt?.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile with get-prefixed named', () => {
    const transpiled = transpileGlassFileNext(
      `<Prompt>
foo
</Prompt>`,
      {
        workspaceFolder: '/Users/me/glassc',
        folderPath: '/Users/me/glassc',
        fileName: 'get-foo',
        language: 'typescript',
        outputDirectory: '/Users/me/glassc/src',
      }
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt?: {
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}

  const GLASSVAR = {}
  const TEMPLATE = \`<Prompt>
foo
</Prompt>\`
  return await runGlass('get-foo', 'text-davinci-003', TEMPLATE, {
    ...(opt?.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile with interpolation variables', () => {
    const transpiled = transpileGlassFileNext(
      `<Prompt>
\${foo}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt: {
  args: { foo: string },
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}
  const { foo } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = \`<Prompt>
\${foo}
</Prompt>\`
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile including interstitial text', () => {
    const transpiled = transpileGlassFileNext(
      `ignore me
<Prompt>
\${foo}
</Prompt>
and me`,
      folders
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt: {
  args: { foo: string },
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}
  const { foo } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = \`ignore me
<Prompt>
\${foo}
</Prompt>
and me\`
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile into javascript', () => {
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
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile with non-interpolation sequences', () => {
    const transpiled = transpileGlassFileNext(
      `<Prompt>
\${foo} and {foo}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt: {
  args: { foo: string },
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}
  const { foo } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = \`<Prompt>
\${foo} and {foo}
</Prompt>\`
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile with multiple interpolation variables', () => {
    const transpiled = transpileGlassFileNext(
      `<Prompt>
\${foo} \${bar}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt: {
  args: { foo: string, bar: string },
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}
  const { foo, bar } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = \`<Prompt>
\${foo} \${bar}
</Prompt>\`
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile with duplicate interpolation variables', () => {
    const transpiled = transpileGlassFileNext(
      `<Prompt>
\${foo} \${bar} \${foo}
\${bar}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`export async function getFooPrompt(opt: {
  args: { foo: string, bar: string },
  options?: {
    openaiKey?: string,
    progress?: (data: { nextDoc: string, rawResponse?: string }) => void,
  },
}) {
  const GLASS_STATE = {}
  const { foo, bar } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = \`<Prompt>
\${foo} \${bar} \${foo}
\${bar}
</Prompt>\`
  return await runGlass('foo', 'text-davinci-003', TEMPLATE, {
    ...(opt.options || {}),
    ...{ state: GLASS_STATE, onResponse: undefined },
  })
}`)
  })

  it('should transpile with Args block', () => {
    const { input, output } = loadFixture('transpileGlassNext/args')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with code block', () => {
    const { input, output } = loadFixture('transpileGlassNext/codeBlock')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
    const val = `${2 + 5} i'm in the string`
  })

  it('should transpile with code block containing state', () => {
    const { input, output } = loadFixture('transpileGlassNext/codeBlockWithState')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with complex code block', () => {
    const { input, output } = loadFixture('transpileGlassNext/withImport')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with imports and code interpolations', () => {
    const { input, output } = loadFixture('transpileGlassNext/complex')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadFixture('transpileGlassNext/moreFor')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with dynamic for loop', () => {
    const { input, output } = loadFixture('transpileGlassNext/forLoop')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with single <For> loop', () => {
    const { input, output } = loadFixture('transpileGlassNext/forLoopAttributesOnly')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with single if condition', () => {
    const { input, output } = loadFixture('transpileGlassNext/ifCondition')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })

  it('should transpile with single if condition, string value', () => {
    const { input, output } = loadFixture('transpileGlassNext/singleIfCondition')
    const transpiled = transpileGlassFileNext(input, folders)
    expect(transpiled.code).to.equal(output)
  })
})
