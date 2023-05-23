export function getInterstitialTextPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { foo: string } }) => {
    const GLASS_STATE = {}
    const { foo } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `ignore me
<Prompt>
${foo}
</Prompt>
and me`
    return {
      fileName: 'interstitialText',
      model: 'text-davinci-003',
      interpolatedDoc: TEMPLATE,
      originalDoc: 'ignore me\n<Prompt>\n${foo}\n</Prompt>\nand me',
      state: GLASS_STATE,
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}
