export function getCodeBlockWithStatePrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const initProfile = { firstName: '', lastName: '', hasChatted: false }
    const [profile, setProfile] = useState(initProfile, GLASS_STATE, 'profile')
    const [moreState, setMoreState] = useState('', GLASS_STATE, 'moreState')

    const GLASSVAR = {}
    const TEMPLATE = `<Init>
const initProfile = { firstName: '', lastName: '', hasChatted: false }
const [profile, setProfile] = useState(initProfile)
const [moreState, setMoreState] = useState('')
</Init>

<Request model="gpt-4" onResponse={() => setProfile({ hasChatted: true })} />`
    return {
      fileName: 'codeBlockWithState',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<Init>\nconst initProfile = { firstName: '', lastName: '', hasChatted: false }\nconst [profile, setProfile] = useState(initProfile)\nconst [moreState, setMoreState] = useState('')\n</Init>\n\n<Request model=\"gpt-4\" onResponse={() => setProfile({ hasChatted: true })} />",
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [
        {
          model: 'gpt-4',
          onResponse: () => setProfile({ hasChatted: true }),
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
