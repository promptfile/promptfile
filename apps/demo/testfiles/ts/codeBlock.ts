export function getCodeBlockPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const a = '3'

    const GLASSVAR = {}
    const TEMPLATE = `const a = "3"
<User>
${a}
</User>`
    return {
      fileName: 'codeBlock',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'const a = "3"\n<User>\n${a}\n</User>',
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
    return await runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
