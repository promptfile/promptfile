export function getMultipleInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<User>
${foo} ${bar}
</User>`
    return {
      fileName: 'multipleInterpolation',
      model: 'gpt-3.5-turbo',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<User>\n${foo} ${bar}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
