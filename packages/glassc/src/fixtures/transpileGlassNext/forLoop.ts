import { runGlass } from '@glass-lang/glasslib'

export async function getFooPrompt(opt?: {
  options?: { openaiKey?: string; progress?: (data: { nextDoc: string; rawResponse?: string }) => void }
}) {
  const GLASS_STATE = {}

  const GLASSVAR = {
    '0': [
      { role: 'user', content: 'name an ice cream' },
      { role: 'assistant', content: 'Vanilla' },
      { role: 'user', content: 'name a fruit' },
    ]
      .map(
        m => `<Block role={${JSON.stringify(m.role)}}>
${m.content}
</Block>`
      )
      .join('\n\n'),
  }
  const TEMPLATE = `${GLASSVAR[0]}`
  return await runGlass(
    'foo',
    'gpt-3.5-turbo',
    {
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<For each={[\n    { role: 'user', content: 'name an ice cream' },\n    { role: \"assistant\", content: 'Vanilla' },\n    { role: 'user', content: 'name a fruit' }\n]} item=\"m\">\n<Block role={m.role}>\n${m.content}\n</Block>\n</For>",
    },
    { ...(opt?.options || {}), ...{ state: GLASS_STATE, onResponse: undefined } }
  )
}
