import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt?: {
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}

  const GLASSVAR = {
    '0': true
      ? `<User if={true}>
Goodbye world
</User>`
      : '',
  }
  const TEMPLATE = `<System>
Hello world
</System>

${GLASSVAR[0]}`
  return await runGlass(
    'foo',
    'gpt-3.5-turbo',
    {
      interpolatedDoc: TEMPLATE,
      originalDoc: '<System>\nHello world\n</System>\n\n<User if={true}>\nGoodbye world\n</User>',
    },
    { ...(opt?.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
