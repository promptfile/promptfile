import { ChatBlock } from '../parseChatBlocks'
import { LLMFunction } from '../parseGlassFunctions'

export function transpileToRuby(
  blocks: ChatBlock[],
  variables: string[],
  functions: LLMFunction[],
  model: string
): string {
  let transpiledCode = ''

  // Define the class and initialize method
  transpiledCode += 'class Prompt\n'
  transpiledCode += '    def initialize(' + variables.join(', ') + ')\n'
  transpiledCode += `        @model = "${model}"\n`
  transpiledCode += '        @functions = []\n'
  transpiledCode += '        @blocks = [\n'

  // Create blocks
  for (const block of blocks) {
    transpiledCode += '            {\n'
    for (const key in block) {
      if (key === 'content') {
        let content = block[key] as string
        content = content.replace(/@\{([^\}]*)\}/g, '#{\\1}')
        transpiledCode += `                "${key}" => %Q{${content}},\n`
      } else {
        transpiledCode += `                "${key}" => "${(block as any)[key]}",\n`
      }
    }
    transpiledCode += '            },\n'
  }

  // Close blocks and class
  transpiledCode += '        ]\n'
  transpiledCode += '    end\n'
  transpiledCode += 'end\n'

  return transpiledCode
}
