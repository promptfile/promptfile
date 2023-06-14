#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as glassc from './index'

function main() {
  yargs(hideBin(process.argv))
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

        const workspaceDirectory = path.resolve('.')
        const sourceDirectory = path.resolve(argv.sourceDirectory as string)
        const outputDirectory = path.resolve(argv.outputDirectory)

        const output = glassc.transpileGlassTypescript(workspaceDirectory, sourceDirectory, argv.lang, outputDirectory)
        fs.writeFileSync(path.join(outputDirectory, 'glass.ts'), output)
      }
    ).argv

  // Your CLI logic goes here. For example:
  // console.log('Running glassc...')
  // glassc.transpileGlassTypescript(
}

main()

export {}
