export function getForLoopPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt?: {}) => {
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
    return {
      fileName: 'forLoop',
      model: 'gpt-3.5-turbo',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<For each={[\n    { role: 'user', content: 'name an ice cream' },\n    { role: \"assistant\", content: 'Vanilla' },\n    { role: 'user', content: 'name a fruit' }\n]} item=\"m\">\n<Block role={m.role}>\n${m.content}\n</Block>\n</For>",
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
