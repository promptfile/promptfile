export function getNonInterpolationSequencePrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string } }) => {
    const GLASS_STATE = {}
    const { foo } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<Prompt>
${foo} and {foo}
</Prompt>`
    return {
      fileName: 'nonInterpolationSequence',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Prompt>\n${foo} and {foo}\n</Prompt>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
