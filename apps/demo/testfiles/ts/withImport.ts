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
    const TEMPLATE = `import c from "c"

const a = "3"
<User>
${a} ${b} ${c}
</User>`
    return {
      fileName: 'withImport',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'import c from "c"\n\nconst a = "3"\n<User>\n${a} ${b} ${c}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  const run = async (options: {
    args: { b: string }
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
