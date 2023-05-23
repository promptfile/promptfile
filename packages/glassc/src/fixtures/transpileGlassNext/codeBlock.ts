import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt?: {
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}

  const a = '3'

  const GLASSVAR = {}
  const TEMPLATE = `<Code>
const a = "3"
</Code>
<Prompt>
${a}
</Prompt>`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc: '<Code>\nconst a = "3"\n</Code>\n<Prompt>\n${a}\n</Prompt>' },
    { ...(opt?.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
