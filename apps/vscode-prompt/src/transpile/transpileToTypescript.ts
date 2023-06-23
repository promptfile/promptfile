import { ChatBlock, LLMFunction } from '@glass-lang/glasslib'

export function transpileToTypescript(
  blocks: ChatBlock[],
  variables: string[],
  functions: LLMFunction[],
  model: string
): string {
  let transpiledCode = ''

  // Create ChatBlock interface
  transpiledCode += 'interface ChatBlock {\n'
  transpiledCode += "  role: 'system' | 'user' | 'assistant' | 'function';\n"
  transpiledCode += '  content: string;\n'
  transpiledCode += '  name?: string;\n'
  transpiledCode += "  type?: 'function_call';\n"
  transpiledCode += '}\n\n'

  // Create LLMFunction interface
  transpiledCode += 'interface LLMFunction {\n'
  transpiledCode += '  name: string;\n'
  transpiledCode += '  description: string;\n'
  transpiledCode += '  parameters: any;\n'
  transpiledCode += '}\n\n'

  // Create Prompt interface
  transpiledCode += 'interface Prompt {\n'
  transpiledCode += '  model: string;\n'
  transpiledCode += '  blocks: (args: { '

  for (const variable of variables) {
    transpiledCode += `${variable}: string; `
  }

  transpiledCode += '}) => ChatBlock[];\n'
  transpiledCode += '  functions: LLMFunction[];\n'
  transpiledCode += '}\n\n'

  // Create Prompt implementation
  transpiledCode += 'const prompt: Prompt = {\n'
  transpiledCode += `  model: "${model}",\n`
  transpiledCode += `  functions: [\n`

  for (const func of functions) {
    transpiledCode += '    {\n'
    for (const key in func) {
      if (typeof func[key] === 'string') {
        transpiledCode += `      ${key}: "${func[key]}",\n`
      } else {
        transpiledCode += `      ${key}: ${JSON.stringify(func[key])},\n`
      }
    }
    transpiledCode += '    },\n'
  }

  transpiledCode += '  ],\n'
  transpiledCode += `  blocks: (args: { `

  for (const variable of variables) {
    transpiledCode += `${variable}: string; `
  }

  transpiledCode += `}): ChatBlock[] => [\n`

  for (const block of blocks) {
    transpiledCode += '    {\n'
    for (const key in block) {
      if (key === 'content') {
        let content = block[key] as string
        content = content.replace(/@\{([^\}]*)\}/g, (_, p1) => `\$\{args.${p1}\}`)
        transpiledCode += `      ${key}: \`${content}\`,\n`
      } else {
        if (typeof block[key] === 'string') {
          transpiledCode += `      ${key}: "${block[key]}",\n`
        } else {
          transpiledCode += `      ${key}: ${block[key]},\n`
        }
      }
    }
    transpiledCode += '    },\n'
  }

  transpiledCode += '  ]\n'
  transpiledCode += '}\n'

  return transpiledCode
}
