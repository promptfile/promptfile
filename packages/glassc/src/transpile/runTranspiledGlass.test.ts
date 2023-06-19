import { expect } from 'chai'
import { loadDemoFile, loadTestFile } from '../util/loadTestfile'
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
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt().compile({ args: { foo: 'hello', bar: 'world' } })`
    )
    expect(output).to.deep.equal({
      fileName: 'args',
      interpolatedDoc: '\n<User>\nhello world\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      interpolationArgs: {
        bar: 'world',
        foo: 'hello',
      },
      functions: [],
      originalDoc:
        '---\nlanguage: typescript\nargs:\n    foo: number\n    bar: string\n---\n\n<User>\n@{foo} @{bar}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      requestBlocks: [
        {
          maxTokens: undefined,
          model: 'gpt-3.5-turbo',
          onResponse: undefined,
          stopSequence: undefined,
          temperature: undefined,
        },
      ],
      state: {},
    })

    // try {
    const output2 = await eval(
      `${transpiled.code.replace(/^export /gm, '')}\ngetArgsPrompt().compile({ args: { foo: 'hello' } })`
    )
    expect(output2).to.deep.equal({
      fileName: 'args',
      interpolatedDoc: '\n<User>\nhello undefined\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      interpolationArgs: {
        foo: 'hello',
      },
      functions: [],
      originalDoc:
        '---\nlanguage: typescript\nargs:\n    foo: number\n    bar: string\n---\n\n<User>\n@{foo} @{bar}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      requestBlocks: [
        {
          maxTokens: undefined,
          model: 'gpt-3.5-turbo',
          onResponse: undefined,
          stopSequence: undefined,
          temperature: undefined,
        },
      ],
      state: {},
    })
    // } catch (e: any) {
    //   // good
    //   expect(e.message).to.equal('Missing required argument: bar')
    // }
  })

  it('langchain: sequentialNext', async () => {
    const { input } = loadDemoFile('advanced/langchain/sequential/sequentialNext', 'ts')
    const transpiled = transpileGlassFileTypescript(input, { ...folders, fileName: 'args' })
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
      requestBlocks: [
        {
          maxTokens: undefined,
          stopSequence: undefined,
          temperature: undefined,
          model: 'gpt-3.5-turbo',
          onResponse: undefined,
        },
        {
          maxTokens: undefined,
          stopSequence: undefined,
          temperature: undefined,
          model: 'gpt-3.5-turbo',
          onResponse: undefined,
        },
      ],
      functions: [],
      originalDoc:
        '<User>\nYou are a playwright. Given the title of a play, it is your job to write a synopsis for that title.\n\nTitle: @{title}\n</User>\n\n<Request model="gpt-3.5-turbo" />\n\n<User>\nYou are a play critic from the New York Times. Given the synopsis you provided above, write a review for the play.\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      state: {},
    })
  })
})
