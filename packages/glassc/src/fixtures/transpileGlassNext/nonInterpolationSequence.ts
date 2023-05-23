import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt: {
  args: { foo: string }
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}
  const { foo } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = `<Prompt>
${foo} and {foo}
</Prompt>`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc: '<Prompt>\n${foo} and {foo}\n</Prompt>' },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
