
import { sayHello } from '../say-hello'

export async function getComplexPrompt(args: { agentName: string; instructions: string; transcript: string }) {
  const { agentName, instructions, transcript } = args
  sayHello({ name: 'chat' })
  const GLASSVAR = {}
  const TEMPLATE = `<Code>
import {sayHello} from './say-hello'

sayHello({ name: 'chat' })
</Code>

<System>
Read a Transcript and determine how to respond about the property's ${sayHello({ name: 'chat' })}. Valid responses are:

- \`NO_RESPONSE\`: use this if the transcript has nothing to do with ${agentName}
- \`HELP: <reason>\`: use this if the information you have about the ${agentName} is insufficient to provide an answer and you require more information
- \`<your response>\`: a useful response to the User given the property's ${agentName}

${(function generateCodeExamples() {
  const examples = []
  for (let i = 0; i < 10; i++) {
    examples.push(Math.random())
  }
  return examples.join('\n')
})()}
</System>

<User>
${agentName}
###
${instructions}
###

Transcript
###
${transcript}
###
</User>

<Request model="gpt-3.5-turbo" />`
  return {
    interpolatedDoc: TEMPLATE,
    functions: [],
  }
}