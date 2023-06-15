export function getDuplicateInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<User>
${foo} ${bar} ${foo}
${bar}
</User>`
    return {
      fileName: 'duplicateInterpolation',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<User>\n${foo} ${bar} ${foo}\n${bar}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
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
