import { checkOk } from '@glass-lang/util'
import { parseChatBlocks } from '../parseChatBlocks'
import { parseFrontmatterFromGlass } from '../parseFrontmatterFromGlass'
import { parseGlassFunctions } from '../parseGlassFunctions'
import { parseGlassMetadata } from '../parseGlassMetadata'
import { transpileToJavascript } from './transpileToJavascript'
import { transpileToPython } from './transpileToPython'
import { transpileToRuby } from './transpileToRuby'
import { transpileToTypescript } from './transpileToTypescript'

export function transpile(text: string, language: string, defaultModel: string) {
  checkOk(
    language === 'typescript' || language === 'python' || language === 'javascript' || language === 'ruby',
    `Invalid language: ${language}`
  )
  const frontmatter = parseFrontmatterFromGlass(text)
  const model = frontmatter?.model ?? defaultModel
  const blocks = parseChatBlocks(text)
  const variables = parseGlassMetadata(text).interpolationVariables
  const functions = parseGlassFunctions(text)
  let code = ''
  try {
    if (language === 'typescript') {
      code = transpileToTypescript(blocks, variables, functions, model)
    } else if (language === 'javascript') {
      code = transpileToJavascript(blocks, variables, functions, model)
    } else if (language === 'python') {
      code = transpileToPython(blocks, variables, functions, model)
    } else if (language === 'ruby') {
      code = transpileToRuby(blocks, variables, functions, model)
    }
    if (code.length === 0) {
      throw new Error(`No code was generated for ${language}`)
    }
    return code
  } catch (error) {
    console.error(error)
    throw error
  }
}
