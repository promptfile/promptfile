export function getNoInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const GLASSVAR = {}
    const TEMPLATE = `<User>
foo
</User>`
    return {
      fileName: 'noInterpolation',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<User>\nfoo\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
