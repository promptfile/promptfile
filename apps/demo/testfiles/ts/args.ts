export async function getArgsPrompt(args: { foo: number; bar: string }) {
  const { foo, bar } = args

  const GLASSVAR = {}
  const TEMPLATE = `
<User>
${foo} ${bar}
</User>

<Request model="gpt-3.5-turbo" />`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}