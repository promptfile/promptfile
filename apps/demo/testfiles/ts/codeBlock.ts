export function getCodeBlockPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const a = '3'

    const GLASSVAR = {}
    const TEMPLATE = `const a = "3"
<User>
${a}
</User>`
    return {
      fileName: 'codeBlock',
      model: 'gpt-3.5-turbo',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'const a = "3"\n<User>\n${a}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
