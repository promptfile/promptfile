import c from 'c'

export function getWithImportPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { b: string } }) => {
    const GLASS_STATE = {}
    const { b } = opt.args
    const a = '3'

    const GLASSVAR = {}
    const TEMPLATE = `<Init>
import c from 'c'

const a = '3'
</Init>

<User>
${a} ${b} ${c}
</User>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'withImport',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<Init>\nimport c from 'c'\n\nconst a = '3'\n</Init>\n\n<User>\n@{a} @{b} @{c}\n</User>\n\n<Request model=\"gpt-3.5-turbo\" />",
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [
        {
          model: 'gpt-3.5-turbo',
          onResponse: undefined,
          temperature: undefined,
          maxTokens: undefined,
          stopSequence: undefined,
        },
      ],
      functions: [],
    }
  }

  const run = async (options: {
    args: { b: string }
    tokenCounter?: {
      countTokens: (str: string, model: string) => number
      maxTokens: (model: string) => number
      reserveCount?: number
    }
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextGlassfile: string; response: string }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
