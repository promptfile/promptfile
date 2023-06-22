export async function getMultipleInterpolationPrompt(args: { foo: string; bar: string }) {
  const { foo, bar } = args

  const GLASSVAR = {}
  const TEMPLATE = `<User>
${foo} ${bar}
</User>`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}