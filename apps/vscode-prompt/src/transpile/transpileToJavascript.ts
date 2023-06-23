import { ChatBlock, LLMFunction } from '@glass-lang/glasslib'

export function transpileToJavascript(
  blocks: ChatBlock[],
  variables: string[],
  functions: LLMFunction,
  model: string
): string {
  let transpiledCode = ''

  // Create Prompt implementation
  transpiledCode += 'const prompt = {\n'
  transpiledCode += `  model: "${model}",\n`
  transpiledCode += '  functions: [],\n'
  transpiledCode += `  blocks: function(${variables.join(', ')}) {\n`
  transpiledCode += '    return [\n'

  for (const block of blocks) {
    transpiledCode += '      {\n'
    for (const key in block) {
      if (key === 'content') {
        let content = block[key] as string
        content = content.replace(/@\{([^\}]*)\}/g, (_, p1) => `\$\{${p1}\}`)
        transpiledCode += `        ${key}: \`${content}\`,\n`
      } else {
        transpiledCode += `        ${key}: "${block[key]}",\n`
      }
    }
    transpiledCode += '      },\n'
  }

  transpiledCode += '    ]\n'
  transpiledCode += '  }\n'
  transpiledCode += '}\n'

  return transpiledCode
}
