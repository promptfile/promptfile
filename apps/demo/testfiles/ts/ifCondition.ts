export async function getIfConditionPrompt() {
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
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}
