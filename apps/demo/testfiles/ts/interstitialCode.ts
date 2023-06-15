export function getInterstitialCodePrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const foo = 'bar'
    const baz = 'bar'

    const GLASSVAR = {}
    const TEMPLATE = `const foo = "bar"
<User>
${foo}
</User>
const baz = "bar"`
    return {
      fileName: 'interstitialCode',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'const foo = "bar"\n<User>\n${foo}\n</User>\nconst baz = "bar"',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
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
      nextDocument: string
      transcript: { role: string; content: string; id: string }[]
      response: string
    }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
