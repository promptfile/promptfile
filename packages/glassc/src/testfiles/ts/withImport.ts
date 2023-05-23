import c from 'c'

export function getWithImportPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { b: string } }) => {
    const GLASS_STATE = {}
    const { b } = opt.args
    const a = '3'

    const GLASSVAR = {}
    const TEMPLATE = `import c from "c"

<Code>
const a = "3"
</Code>
<Prompt>
${a} ${b} ${c}
</Prompt>`
    return {
      fileName: 'withImport',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'import c from "c"\n\n<Code>\nconst a = "3"\n</Code>\n<Prompt>\n${a} ${b} ${c}\n</Prompt>',
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
