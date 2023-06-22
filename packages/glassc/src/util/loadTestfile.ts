import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function loadDemoFile(file: string, ext: string) {
  const input = fs.readFileSync(path.join(__dirname, '../../../..', 'apps/demo', file + '.prompt'), 'utf-8')
  const outputExists = fs.existsSync(path.join(__dirname, '../../../..', 'apps/demo', file + `.${ext}`))
  const output = outputExists
    ? fs.readFileSync(path.join(__dirname, '../../../..', 'apps/demo', file + `.${ext}`), 'utf-8')
    : undefined
  return {
    input,
    output,
  }
}

export function loadTestFile(file: string, ext: string) {
  const { input, output } = loadDemoFile(file, ext)
  return { input, output: output! }
}
