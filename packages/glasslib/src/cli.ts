#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { transpileFile, transpilePrefix } from './transpile/transpile'

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

        const sourceDirectory = path.resolve(argv.sourceDirectory as string)
        const outputDirectory = path.resolve(argv.outputDirectory)

        // use fs to find all .prompt files in the sourceDirectory, recursively
        const walkSync = (dir: string, filelist: string[] = []) => {
          fs.readdirSync(dir).forEach(file => {
            filelist = fs.statSync(path.join(dir, file)).isDirectory()
              ? walkSync(path.join(dir, file), filelist)
              : filelist.concat(path.basename(file).endsWith('.prompt') ? path.join(dir, file) : [])
          })
          return filelist
        }

        const allFilePaths = walkSync(sourceDirectory)
        const transpilerOutput = allFilePaths.map(f => transpileFile(f, argv.lang, defaultModel))

        const fullFile = transpilePrefix(argv.lang) + '\n\n' + transpilerOutput.map(o => o.out).join('\n\n')

        fs.writeFileSync(path.join(outputDirectory, 'prompts.ts'), fullFile)
      }
    ).argv
}

main()

export {}
