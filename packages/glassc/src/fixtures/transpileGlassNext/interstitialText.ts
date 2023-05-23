import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt: {
  args: { foo: string }
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}
  const { foo } = opt.args

  const GLASSVAR = {}
  const TEMPLATE = `ignore me
<Prompt>
${foo}
</Prompt>
and me`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc: 'ignore me\n<Prompt>\n${foo}\n</Prompt>\nand me' },
    { ...(opt.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
