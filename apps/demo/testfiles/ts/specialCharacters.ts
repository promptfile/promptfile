export function getSpecialCharactersPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const type = 'assistant'
    const role = `helpful ${type}`

    const GLASSVAR = {}
    const TEMPLATE = `const type = 'assistant'
const role = \`helpful \${type}\`

<System>
You are a ${role}.
</System>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'specialCharacters',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        'const type = \'assistant\'\nconst role = `helpful ${type}`\n\n<System>\nYou are a ${role}.\n</System>\n\n<Request model="gpt-3.5-turbo" />',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [{ model: 'gpt-3.5-turbo', onResponse: undefined }],
    }
  }

  return { getTestData, compile }
}
