export function getCodeBlockPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const a = '3'

    const GLASSVAR = {}
    const TEMPLATE = `<Code>
const a = "3"
</Code>

<User>
${a}
</User>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'codeBlock',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Code>\nconst a = "3"\n</Code>\n\n<User>\n@{a}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
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
    args?: {}
    tokenCounter?: {
      countTokens: (str: string, model: string) => number
      maxTokens: (model: string) => number
      reserveCount?: number
    }
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
