export function getIfConditionPrompt() {
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

${GLASSVAR[0]}

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'ifCondition',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        '<System>\nHello world\n</System>\n\n<User if={true}>\nGoodbye world\n</User>\n\n<Request model="gpt-3.5-turbo" />',
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
    progress?: (data: { nextGlassfile: string; response: string }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
