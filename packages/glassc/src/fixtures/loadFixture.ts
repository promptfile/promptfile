import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function loadFixture(name: string) {
  const [dir, file] = name.split('/')
  const inputOutput = fs.readFileSync(path.join(__dirname, dir, file + '.fixture'), 'utf-8')
  const [input, output] = inputOutput.split('\n---\n')
  return {
    input,
    output,
  }
}
