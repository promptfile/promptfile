import { runGlass } from '@glass-lang/glasslib'
import c from 'c'

export async function getFooPrompt(opt: {
  args: { b: string }
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}
  const { b } = opt.args
  const a = '3'

  const GLASSVAR = {}
  const TEMPLATE = `import c from "c"

<Code>
const a = "3"
</Code>
<Prompt>
${a} ${b} ${c}
</Prompt>`
  return await runGlass(
    'foo',
    'text-davinci-003',
    {
      interpolatedDoc: TEMPLATE,
      originalDoc: 'import c from "c"\n\n<Code>\nconst a = "3"\n</Code>\n<Prompt>\n${a} ${b} ${c}\n</Prompt>',
    },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
