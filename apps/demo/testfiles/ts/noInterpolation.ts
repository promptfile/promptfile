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
      interpolatedDoc: TEMPLATE,
      originalDoc: '<User>\nfoo\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  return { getTestData, compile }
}
