import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt: {
  args: { foo: string; bar: string }
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}
  const { foo, bar } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = `<Prompt>
${foo} ${bar} ${foo}
${bar}
</Prompt>`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc: '<Prompt>\n${foo} ${bar} ${foo}\n${bar}\n</Prompt>' },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
