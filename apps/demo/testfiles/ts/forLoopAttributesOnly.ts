export function getForLoopAttributesOnlyPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const items = [{ role: 'user', content: 'who was gandhi?' }]

    const GLASSVAR = {
      '0': items
        .map(
          item => `<Block role={${JSON.stringify(item.role)}}>
${item.content}
</Block>`
        )
        .join('\n\n'),
    }
    const TEMPLATE = `const items = [{role: 'user', content: 'who was gandhi?'}]

${GLASSVAR[0]}
`
    return {
      fileName: 'forLoopAttributesOnly',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "const items = [{role: 'user', content: 'who was gandhi?'}]\n\n<For each={items} as=\"item\">\n<Block role={item.role}>\n${item.content}\n</Block>\n</For>\n",
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
