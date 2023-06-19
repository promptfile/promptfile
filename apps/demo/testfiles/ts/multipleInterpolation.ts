export function getMultipleInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<User>
${foo} ${bar}
</User>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'multipleInterpolation',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<User>\n@{foo} @{bar}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
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
    args: { foo: string; bar: string }
    transcriptTokenCounter?: {
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