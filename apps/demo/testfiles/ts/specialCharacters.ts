export function getSpecialCharactersPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const type = 'assistant'
    const role = `helpful ${type} @{type}`

    const GLASSVAR = {}
    const TEMPLATE = `<Code>
const type = 'assistant'
const role = \`helpful \${type} @{type}\`
</Code>

<System>
You are a ${role}.
</System>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'specialCharacters',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        '<Code>\nconst type = \'assistant\'\nconst role = `helpful ${type} @{type}`\n</Code>\n\n<System>\nYou are a @{role}.\n</System>\n\n<Request model="gpt-3.5-turbo" />',
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
