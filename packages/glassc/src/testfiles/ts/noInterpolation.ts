export function getNoInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const GLASSVAR = {}
    const TEMPLATE = `<Prompt>
foo
</Prompt>`
    return {
      fileName: 'noInterpolation',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Prompt>\nfoo\n</Prompt>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
