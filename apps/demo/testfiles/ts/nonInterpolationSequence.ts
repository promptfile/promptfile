export async function getNonInterpolationSequencePrompt(args: { foo: string }) {
  const { foo } = args

  const GLASSVAR = {}
  const TEMPLATE = `<User>
${foo} and {foo} and \${foo} \`cool\`
</User>`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}