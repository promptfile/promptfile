export function getInterstitialCodePrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const foo = 'bar'
    const baz = 'bar'

    const GLASSVAR = {}
    const TEMPLATE = `<Code>
const foo = "bar"
const baz = "bar"
</Code>

<User>
${foo}
</User>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'interstitialCode',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        '<Code>\nconst foo = "bar"\nconst baz = "bar"\n</Code>\n\n<User>\n${foo}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
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
    }
  }

  const run = async (options: {
    args?: {}
    transcriptTokenCounter?: {
      countTokens: (str: string, model: string) => number
      maxTokens: (model: string) => number
      reserveCount?: number
    }
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: {
      nextGlassfile: string
      transcript: { role: string; content: string; id: string }[]
      response: string
    }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
