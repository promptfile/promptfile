export function getArgsPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: number; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<Args foo="number" bar="string" />
<Prompt>
${foo} ${bar}
</Prompt>`
    return {
      fileName: 'args',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<Args foo="number" bar="string" />\n<Prompt>\n${foo} ${bar}\n</Prompt>',
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}