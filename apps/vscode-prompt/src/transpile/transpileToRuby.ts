import { ChatBlock } from '@glass-lang/glasslib'

export function transpileToRuby(blocks: ChatBlock[], variables: string[]): string {
  let transpiledCode = ''

  // Define the class and initialize method
  transpiledCode += 'class Prompt\n'
  transpiledCode += '    def initialize(' + variables.join(', ') + ')\n'
  transpiledCode += '        @model = "gpt-4"\n'
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
        transpiledCode += `                "${key}" => "${block[key]}",\n`
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
