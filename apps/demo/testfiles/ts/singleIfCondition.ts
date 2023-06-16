export function getSingleIfConditionPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const GLASSVAR = {
      '0': true
        ? `<User if={true}>
Goodbye world
</User>`
        : '',
    }
    const TEMPLATE = `<System>
Hello world
</System>

${GLASSVAR[0]}`
    return {
      fileName: 'singleIfCondition',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<System>\nHello world\n</System>\n\n<User if={true}>\nGoodbye world\n</User>',
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
