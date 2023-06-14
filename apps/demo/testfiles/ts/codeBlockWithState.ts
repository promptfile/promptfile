export function getCodeBlockWithStatePrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const initProfile = { firstName: '', lastName: '', hasChatted: false }
    const [profile, setProfile] = useState(initProfile, GLASS_STATE, 'profile')
    const [moreState, setMoreState] = useState('', GLASS_STATE, 'moreState')

    const GLASSVAR = {}
    const TEMPLATE = `const initProfile = { firstName: '', lastName: '', hasChatted: false }
const [profile, setProfile] = useState(initProfile)
const [moreState, setMoreState] = useState('')

<Request model="gpt-4" onResponse={() => setProfile({ hasChatted: true})}>
hello world
</Request>`
    return {
      fileName: 'codeBlockWithState',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "const initProfile = { firstName: '', lastName: '', hasChatted: false }\nconst [profile, setProfile] = useState(initProfile)\nconst [moreState, setMoreState] = useState('')\n\n<Request model=\"gpt-4\" onResponse={() => setProfile({ hasChatted: true})}>\nhello world\n</Request>",
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

  return { getTestData, compile }
}
