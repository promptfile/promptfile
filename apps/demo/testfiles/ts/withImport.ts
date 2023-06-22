import c from 'c'

export async function getWithImportPrompt(args: { b: string }) {
  const { b } = args
  const a = '3'
  const GLASSVAR = {}
  const TEMPLATE = `<Code>
import c from 'c'

const a = '3'
</Code>

<User>
${a} ${b} ${c}
</User>`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}
