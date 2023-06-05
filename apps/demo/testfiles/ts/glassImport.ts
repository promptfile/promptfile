import { runGlass, useState } from '@glass-lang/glasslib'

export function getQuestionAnswerPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args: { question: string } }) => {
    const GLASS_STATE = {}
    const { question } = opt.args

    const GLASSVAR = {}
    const TEMPLATE = `<System>
You are a helpful assistant.
</System>

<User>
${question}
</User>

<Request model="gpt-3.5-turbo" />`
    return {
      fileName: 'questionAnswer',
      model: 'gpt-3.5-turbo',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        '<System>\nYou are a helpful assistant.\n</System>\n\n<User>\n${question}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: undefined,
    }
  }

  return { getTestData, compile }
}

async function questionAnswer(args: any) {
  const { getTestData, compile } = getQuestionAnswerPrompt()
  const c = await compile({ args })
  const res = await runGlass(c as any)
  return res.codeResponse !== undefined ? res.codeResponse : res.rawResponse
}

export function getGlassImportPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: {}) => {
    const GLASS_STATE = {}

    const [field, setField] = useState('', GLASS_STATE, 'field')

    const GLASSVAR = {}
    const TEMPLATE = `import questionAnswer from './questionAnswer.glass'

const [field, setField] = useState('')

<Assistant>
You are an assistant that creates questions for Jeopardy.
</Assistant>

<User>
Make a question about United States history.
</User>

<Request model="gpt-3.5-turbo" onResponse={async ({ message }) => {
    const answer = await questionAnswer({question: message})
    setField(answer)
}} />`
    return {
      fileName: 'glassImport',
      model: 'gpt-3.5-turbo',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "import questionAnswer from './questionAnswer.glass'\n\nconst [field, setField] = useState('')\n\n<Assistant>\nYou are an assistant that creates questions for Jeopardy.\n</Assistant>\n\n<User>\nMake a question about United States history.\n</User>\n\n<Request model=\"gpt-3.5-turbo\" onResponse={async ({ message }) => {\n    const answer = await questionAnswer({question: message})\n    setField(answer)\n}} />",
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      onResponse: async ({ message }) => {
        const answer = await questionAnswer({ question: message })
        setField(answer)
      },
    }
  }

  return { getTestData, compile }
}
