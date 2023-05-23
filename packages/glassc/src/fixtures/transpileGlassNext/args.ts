import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt: {
  args: { foo: number; bar: string }
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}
  const { foo, bar } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = `<Args foo="number" bar="string" />
<Prompt>
${foo} ${bar}
</Prompt>`
  return await runGlass(
    'foo',
    'text-davinci-003',
    {
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Args foo="number" bar="string" />\n<Prompt>\n${foo} ${bar}\n</Prompt>',
    },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
