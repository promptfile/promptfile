export function getArgsPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: number; bar: string } }) => {
    const GLASS_STATE = {}
    const { foo, bar } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<Prompt>
${foo} ${bar}
</Prompt>`
    return {
      fileName: 'args',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        '---\nlanguage: typescript\nargs:\n    foo: number\n    bar: string\n---\n<Prompt>\n${foo} ${bar}\n</Prompt>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
