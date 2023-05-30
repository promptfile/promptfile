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
      model: 'gpt-3.5-turbo',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'const foo = "bar"\n<User>\n${foo}\n</User>\nconst baz = "bar"',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
