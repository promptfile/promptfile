import { runGlass, useState } from '@glass-lang/glasslib'

export async function getFooPrompt(opt?: {
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}

  const initProfile = { firstName: '', lastName: '', hasChatted: false }
  const [profile, setProfile] = useState(initProfile, GLASS_STATE, 'profile')
  const [moreState, setMoreState] = useState('', GLASS_STATE, 'moreState')

  const GLASSVAR = {}
  const TEMPLATE = `<Code>
const initProfile = { firstName: '', lastName: '', hasChatted: false }
const [profile, setProfile] = useState(initProfile)
const [moreState, setMoreState] = useState('')
</Code>

<Chat model="gpt-4" onResponse={() => setProfile({ hasChatted: true})}>
hello world
</Chat>`
  return await runGlass(
    'foo',
    'gpt-4',
    {
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<Code>\nconst initProfile = { firstName: '', lastName: '', hasChatted: false }\nconst [profile, setProfile] = useState(initProfile)\nconst [moreState, setMoreState] = useState('')\n</Code>\n\n<Chat model=\"gpt-4\" onResponse={() => setProfile({ hasChatted: true})}>\nhello world\n</Chat>",
    },
    { ...(opt?.options || {}), ...{ state: GLASS_STATE, onResponse: () => setProfile({ hasChatted: true }) } }
  )
}
