import { ChatBlock } from '@glass-lang/glasslib'

export function transpileToTypescript(blocks: ChatBlock[], variables: string[], model: string): string {
  let transpiledCode = ''

  // Create Args interface
  transpiledCode += 'interface Args {\n'
  for (const variable of variables) {
    transpiledCode += `  ${variable}: string;\n`
  }
  transpiledCode += '}\n\n'

  // Create Prompt interface
  transpiledCode += 'interface Prompt {\n'
  transpiledCode += '  model: string;\n'
  transpiledCode += '  blocks: (args: Args) => ChatBlock[];\n'
  transpiledCode += '  functions: any[];\n'
  transpiledCode += '}\n\n'

  // Create Prompt implementation
  transpiledCode += 'const prompt: Prompt = {\n'
  transpiledCode += `  model: "${model}",\n`
  transpiledCode += '  functions: [],\n'
  transpiledCode += `  blocks: (args: Args): ChatBlock[] => [\n`

  for (const block of blocks) {
    transpiledCode += '    {\n'
    for (const key in block) {
      if (key === 'content') {
        let content = block[key] as string
        content = content.replace(/@\{([^\}]*)\}/g, (_, p1) => `\$\{args.${p1}\}`)
        transpiledCode += `      ${key}: \`${content}\`,\n`
      } else {
        transpiledCode += `      ${key}: "${block[key]}",\n`
      }
    }
    transpiledCode += '    },\n'
  }

  transpiledCode += '  ]\n'
  transpiledCode += '}\n'

  return transpiledCode
}
