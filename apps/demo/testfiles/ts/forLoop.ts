export async function getForLoopPrompt() {
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
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}
