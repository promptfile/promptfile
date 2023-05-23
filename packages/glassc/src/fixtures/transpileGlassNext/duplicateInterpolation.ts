export function getDuplicateInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<Prompt>
${foo} ${bar} ${foo}
${bar}
</Prompt>`
    return {
      fileName: 'duplicateInterpolation',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Prompt>\n${foo} ${bar} ${foo}\n${bar}\n</Prompt>',
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
