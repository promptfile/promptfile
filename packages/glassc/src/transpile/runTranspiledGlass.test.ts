import { expect } from 'chai'
import { loadDemoFile, loadTestFile } from '../util/loadTestfile'
import { transpileGlassFileNext } from './transpileGlassNext'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'javascript',
  outputDirectory: '/Users/me/glassc/src',
}

describe('runTranspiledGlass', () => {
  it('simple: no interpolation vars', async () => {
    const { input } = loadTestFile('testfiles/ts/noInterpolation', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'noInterpolation' })
    const output = await eval(`${transpiled.code.replace(/^export /gm, '')}\ngetNoInterpolationPrompt().compile({})`)
    expect(output).to.deep.equal({
      fileName: 'noInterpolation',
      interpolatedDoc: '<User>\nfoo\n</User>',
      interpolationArgs: {},
      model: 'gpt-3.5-turbo',
      onResponse: undefined,
      originalDoc: '<User>\nfoo\n</User>',
      state: {},
    })
  })

  it('simple: 2 args w/ frontmatter', async () => {
    const { input } = loadTestFile('testfiles/ts/args', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'args' })
    const output = await eval(
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt().compile({ args: { foo: 'hello', bar: 'world' } })`
    )
    expect(output).to.deep.equal({
      fileName: 'args',
      interpolatedDoc: '<User>\nhello world\n</User>',
      interpolationArgs: {
        bar: 'world',
        foo: 'hello',
      },
      model: 'gpt-3.5-turbo',
      onResponse: undefined,
      originalDoc:
        '---\nlanguage: typescript\nargs:\n    foo: number\n    bar: string\n---\n<User>\n${foo} ${bar}\n</User>',
      state: {},
    })

    // try {
    const output2 = await eval(
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt().compile({ args: { foo: 'hello' } })`
    )
    expect(output2).to.deep.equal({
      fileName: 'args',
      interpolatedDoc: '<User>\nhello undefined\n</User>', // TODO(john): this should fail if an argument is not provided but required
      interpolationArgs: {
        foo: 'hello',
      },
      model: 'gpt-3.5-turbo',
      onResponse: undefined,
      originalDoc:
        '---\nlanguage: typescript\nargs:\n    foo: number\n    bar: string\n---\n<User>\n${foo} ${bar}\n</User>',
      state: {},
    })
    // } catch (e: any) {
    //   // good
    //   expect(e.message).to.equal('Missing required argument: bar')
    // }
  })

  it('langchain: sequentialNext', async () => {
    const { input } = loadDemoFile('langchain/sequential/sequentialNext', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'args' })
    const output = await eval(
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt().compile({ args: { title: 'hello' } })`
    )
    expect(output).to.deep.equal({
      fileName: 'args',
      interpolatedDoc:
        '<User>\nYou are a playwright. Given the title of a play, it is your job to write a synopsis for that title.\n\nTitle: hello\n</User>\n\n<Request model="gpt-3.5-turbo" />\n\n<User>\nYou are a play critic from the New York Times. Given the synopsis you provided above, write a review for the play.\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      interpolationArgs: {
        title: 'hello',
      },
      model: 'gpt-3.5-turbo',
      onResponse: undefined,
      originalDoc:
        '<User>\nYou are a playwright. Given the title of a play, it is your job to write a synopsis for that title.\n\nTitle: ${title}\n</User>\n\n<Request model="gpt-3.5-turbo" />\n\n<User>\nYou are a play critic from the New York Times. Given the synopsis you provided above, write a review for the play.\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      state: {},
    })
  })

  it('langchain: sequentialNext', async () => {
    const { input } = loadDemoFile('langchain/sequential/sequentialNext', 'ts')
    const transpiled = transpileGlassFileNext(input, { ...folders, fileName: 'args' })
    const output = await eval(
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt().compile({ args: { title: 'hello' } })`
    )
    expect(output).to.deep.equal({
      fileName: 'args',
      interpolatedDoc:
        '<User>\nYou are a playwright. Given the title of a play, it is your job to write a synopsis for that title.\n\nTitle: hello\n</User>\n\n<Request model="gpt-3.5-turbo" />\n\n<User>\nYou are a play critic from the New York Times. Given the synopsis you provided above, write a review for the play.\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      interpolationArgs: {
        title: 'hello',
      },
      model: 'gpt-3.5-turbo',
      onResponse: undefined,
      originalDoc:
        '<User>\nYou are a playwright. Given the title of a play, it is your job to write a synopsis for that title.\n\nTitle: ${title}\n</User>\n\n<Request model="gpt-3.5-turbo" />\n\n<User>\nYou are a play critic from the New York Times. Given the synopsis you provided above, write a review for the play.\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      state: {},
    })
  })
})
