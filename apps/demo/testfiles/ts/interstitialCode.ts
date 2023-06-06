export function getInterstitialCodePrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const foo = 'bar'
    const baz = 'bar'

    const GLASSVAR = {}
    const TEMPLATE = `const foo = "bar"
<User>
${foo}
</User>
const baz = "bar"`
    return {
      fileName: 'interstitialCode',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'const foo = "bar"\n<User>\n${foo}\n</User>\nconst baz = "bar"',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  return { getTestData, compile }
}
