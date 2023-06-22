import { expect } from 'chai'
import { loadTestFile } from '../util/loadTestfile'
import { transpileGlassFileTypescript } from './transpileGlassTypescript'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'javascript',
  outputDirectory: '/Users/me/glassc/src',
}

describe('runTranspiledGlass', () => {
  it('simple: 2 args w/ frontmatter', async () => {
    const { input } = loadTestFile('testfiles/ts/args', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'args' })
    const output = await eval(
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt({ foo: 'hello', bar: 'world' })`
    )
    expect(output).to.deep.equal({
      interpolatedDoc: '\n<User>\nhello world\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      functions: [],
    })

    // try {
    const output2 = await eval(`${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt({ foo: 'hello' })`)
    expect(output2).to.deep.equal({
      interpolatedDoc: '\n<User>\nhello undefined\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      functions: [],
    })
    // } catch (e: any) {
    //   // good
    //   expect(e.message).to.equal('Missing required argument: bar')
    // }
  })
})
