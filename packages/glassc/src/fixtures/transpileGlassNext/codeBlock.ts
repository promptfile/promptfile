export function getCodeBlockPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt?: {}) => {
    const GLASS_STATE = {}

    const a = '3'

    const GLASSVAR = {}
    const TEMPLATE = `<Code>
const a = "3"
</Code>
<Prompt>
${a}
</Prompt>`
    return {
      fileName: 'codeBlock',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Code>\nconst a = "3"\n</Code>\n<Prompt>\n${a}\n</Prompt>',
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
