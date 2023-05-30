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

const a = "3"
<User>
${a} ${b} ${c}
</User>`
    return {
      fileName: 'withImport',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'import c from "c"\n\nconst a = "3"\n<User>\n${a} ${b} ${c}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
