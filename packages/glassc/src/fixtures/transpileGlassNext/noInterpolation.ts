import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt?: {
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}

  const GLASSVAR = {}
  const TEMPLATE = `<Prompt>
foo
</Prompt>`
  return await runGlass(
    'foo',
    'text-davinci-003',
    { interpolatedDoc: TEMPLATE, originalDoc: '<Prompt>\nfoo\n</Prompt>' },
    { ...(opt?.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
