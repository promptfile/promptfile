import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function loadFixtureNext(name: string) {
  const [dir, file] = name.split('/')
  const input = fs.readFileSync(path.join(__dirname, dir, file + '.glass'), 'utf-8')
  const output = fs.readFileSync(path.join(__dirname, dir, file + '.ts'), 'utf-8')
  // remove the first import line
  return {
    input,
    output,
  }
}
