export function getForLoopAttributesOnlyPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const GLASSVAR = {
      '0': [{ role: 'user', content: 'who was gandhi?' }]
        .map(
          item => `<Block role={${JSON.stringify(item.role)}} content={${JSON.stringify(item.content)}}>
</Block>`
        )
        .join('\n\n'),
    }
    const TEMPLATE = `${GLASSVAR[0]}`
    return {
      fileName: 'forLoopAttributesOnly',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<For each={[{role: 'user', content: 'who was gandhi?'}]} fragment={item => <Block role={item.role} content={item.content} />}  />",
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  return { getTestData, compile }
}
