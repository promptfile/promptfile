export async function getSpecialCharactersPrompt() {
  const type = 'assistant'
  const role = `helpful ${type} @{type}`
  const GLASSVAR = {}
  const TEMPLATE = `<Code>
const type = 'assistant'
const role = \`helpful \${type} @{type}\`
</Code>

<System>
You are a ${role}.
</System>`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}