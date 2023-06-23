import { ChatBlock } from '@glass-lang/glasslib'

export function transpileToPython(blocks: ChatBlock[], variables: string[], model: string): string {
  let transpiledCode = ''

  // Define the class and constructor
  transpiledCode += 'class Prompt:\n'
  transpiledCode += '    def __init__(self, ' + variables.join(', ') + '):\n'
  transpiledCode += `        self.model = "${model}"\n`
  transpiledCode += '        self.functions = []\n'
  transpiledCode += '        self.blocks = [\n'

  // Create blocks
  for (const block of blocks) {
    transpiledCode += '            {\n'
    for (const key in block) {
      if (key === 'content') {
        let content = block[key] as string
        content = content.replace(/@\{([^\}]*)\}/g, (_, p1) => `{${p1}}`)
        transpiledCode += `            "${key}": f"""${content}""",\n`
      } else {
        transpiledCode += `            "${key}": "${block[key]}",\n`
      }
    }
    transpiledCode += '            },\n'
  }

  // Close blocks and class
  transpiledCode += '        ]\n'

  return transpiledCode
}
