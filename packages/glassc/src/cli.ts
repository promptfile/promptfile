#!/usr/bin/env node

import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

function main() {
  const res = yargs(hideBin(process.argv))
    .option('lang', {
      alias: 'l',
      type: 'string',
      demandOption: true,
      description: 'The language to compile to',
    })
    .option('outputDirectory', {
      alias: 'o',
      type: 'string',
      demandOption: true,
      description: 'The output directory for compiled files',
    })
    .option('defaultModel', {
      alias: 'm',
      type: 'string',
      demandOption: false,
      description: 'The default model to use for prompts',
    })
    .command(
      '$0 <sourceDirectory>',
      'compile a directory',
      yargs => {
        yargs.positional('sourceDirectory', {
          describe: 'the directory to compile',
          type: 'string',
        })
      },
      argv => {
        if (argv.lang !== 'typescript') {
          console.error('Only "typescript" is supported for --lang option')
          return
        }
        let defaultModel = argv.defaultModel
        if (!defaultModel) {
          defaultModel = 'gpt-3.5-turbo'
        }

        const workspaceDirectory = path.resolve('.')
        const sourceDirectory = path.resolve(argv.sourceDirectory as string)
        const outputDirectory = path.resolve(argv.outputDirectory)

        // const output = glassc.transpileGlassTypescript(
        //   workspaceDirectory,
        //   sourceDirectory,
        //   argv.lang,
        //   outputDirectory,
        //   defaultModel,
        //   true
        // )
        // fs.writeFileSync(path.join(outputDirectory, 'glass.ts'), output)
      }
    ).argv
}

main()

export {}
