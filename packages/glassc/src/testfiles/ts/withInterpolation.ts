export function getWithInterpolationPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string } }) => {
    const GLASS_STATE = {}
    const { foo } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<Prompt>
${foo}
</Prompt>`
    return {
      fileName: 'withInterpolation',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Prompt>\n${foo}\n</Prompt>',
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
