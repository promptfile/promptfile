export function getIfConditionPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const GLASSVAR = {
      '0': true
        ? `<User if={true}>
Goodbye world
</User>`
        : '',
    }
    const TEMPLATE = `<System>
Hello world
</System>

${GLASSVAR[0]}`
    return {
      fileName: 'ifCondition',
      interpolatedDoc: TEMPLATE,
      originalDoc: '<System>\nHello world\n</System>\n\n<User if={true}>\nGoodbye world\n</User>',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  return { getTestData, compile }
}
