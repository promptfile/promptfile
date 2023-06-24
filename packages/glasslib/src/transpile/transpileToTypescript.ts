import { ChatBlock } from '../parseChatBlocks'
import { LLMFunction } from '../parseGlassFunctions'

export function transpileToTypescript(
  exportName: string,
  blocks: ChatBlock[],
  variables: string[],
  functions: LLMFunction[],
  model: string
): string {
  let transpiledCode = ''

  const argsType = `{ ${variables.map(v => `${v}: string`).join(',')} }`

  // Create Prompt implementation
  transpiledCode += `export const ${exportName}: Prompt<${argsType}> = {\n`
  transpiledCode += `  model: "${model}",\n`
  transpiledCode += `  functions: [\n`

  for (const func of functions) {
    transpiledCode += '    {\n'
    for (const key in func) {
      if (typeof (func as any)[key] === 'string') {
        transpiledCode += `      ${key}: "${(func as any)[key]}",\n`
      } else {
        transpiledCode += `      ${key}: ${JSON.stringify((func as any)[key])},\n`
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
        if (typeof (block as any)[key] === 'string') {
          transpiledCode += `      ${key}: "${(block as any)[key]}",\n`
        } else {
          transpiledCode += `      ${key}: ${(block as any)[key]},\n`
        }
      }
    }
    transpiledCode += '    },\n'
  }

  transpiledCode += '  ]\n'
  transpiledCode += '}\n'

  return transpiledCode
}
