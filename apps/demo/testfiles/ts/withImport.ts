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
      interpolatedDoc: TEMPLATE,
      originalDoc: 'import c from "c"\n\nconst a = "3"\n<User>\n${a} ${b} ${c}\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  return { getTestData, compile }
}
