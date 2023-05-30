export function getDuplicateInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<User>
${foo} ${bar} ${foo}
${bar}
</User>`
    return {
      fileName: 'duplicateInterpolation',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<User>\n${foo} ${bar} ${foo}\n${bar}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
