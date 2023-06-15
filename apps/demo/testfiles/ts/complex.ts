import { sayHello } from '../say-hello'

export function getComplexPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { agentName: string; instructions: string; transcript: string } }) => {
    const GLASS_STATE = {}
    const { agentName, instructions, transcript } = opt.args
    sayHello({ name: 'chat' })

    const GLASSVAR = {}
    const TEMPLATE = `import {sayHello} from './say-hello'

sayHello({ name: 'chat' })

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
</User>`
    return {
      fileName: 'complex',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "import {sayHello} from './say-hello'\n\nsayHello({ name: 'chat' })\n\n<System>\nRead a Transcript and determine how to respond about the property's ${sayHello({ name: 'chat' })}. Valid responses are:\n\n- `NO_RESPONSE`: use this if the transcript has nothing to do with ${agentName}\n- `HELP: <reason>`: use this if the information you have about the ${agentName} is insufficient to provide an answer and you require more information\n- `<your response>`: a useful response to the User given the property's ${agentName}\n\n${\n  function generateCodeExamples() {\n    const examples = []\n    for (let i = 0; i < 10; i++) {\n      examples.push(Math.random())\n    }\n    return examples.join('\\n')\n  }\n}\n</System>\n\n<User>\n${agentName}\n###\n${instructions}\n###\n\nTranscript\n###\n${transcript}\n###\n</User>",
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [],
    }
  }

  const run = async (options: {
    args: { agentName: string; instructions: string; transcript: string }
    transcriptTokenCounter?: {
      countTokens: (str: string, model: string) => number
      maxTokens: (model: string) => number
      reserveCount?: number
    }
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: {
      nextDocument: string
      transcript: { role: string; content: string; id: string }[]
      response: string
    }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
