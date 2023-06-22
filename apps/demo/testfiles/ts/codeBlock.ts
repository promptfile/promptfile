export async function getCodeBlockPrompt() {
  const a = '3'
  const GLASSVAR = {}
  const TEMPLATE = `<Code>
const a = '3'
</Code>

<User>
${a}
</User>`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}