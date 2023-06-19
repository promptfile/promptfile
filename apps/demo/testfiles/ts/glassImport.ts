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
      interpolatedDoc: TEMPLATE,
      originalDoc:
        '<System>\nYou are a helpful assistant.\n</System>\n\n<User>\n@{question}\n</User>\n\n<Request model="gpt-3.5-turbo" />',
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [
        {
          model: 'gpt-3.5-turbo',
          onResponse: undefined,
          temperature: undefined,
          maxTokens: undefined,
          stopSequence: undefined,
        },
      ],
      functions: [],
    }
  }

  const run = async (options: {
    args: { question: string }
    tokenCounter?: {
      countTokens: (str: string, model: string) => number
      maxTokens: (model: string) => number
      reserveCount?: number
    }
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}

async function questionAnswer(args: any) {
  const { getTestData, compile } = getQuestionAnswerPrompt()
  const c = await compile({ args })
  const res = await runGlassTranspilerOutput(c as any)
  return res.response
}

export function getGlassImportPrompt() {
  function getTestData() {
    return {}
  }

  const compile = async (opt: { args?: {} } = { args: {} }) => {
    const GLASS_STATE = {}

    const [field, setField] = useState('', GLASS_STATE, 'field')

    const GLASSVAR = {}
    const TEMPLATE = `<Init>
import questionAnswer from './questionAnswer.glass'

const [field, setField] = useState('')
</Init>

<Assistant>
You are an assistant that creates questions for Jeopardy.
</Assistant>

<User>
Make a question about United States history.
</User>

<Request
  model="gpt-3.5-turbo"
  onResponse={async ({ message }) => {
    const answer = await questionAnswer({ question: message })
    setField(answer)
  }}
/>`
    return {
      fileName: 'glassImport',
      interpolatedDoc: TEMPLATE,
      originalDoc:
        "<Init>\nimport questionAnswer from './questionAnswer.glass'\n\nconst [field, setField] = useState('')\n</Init>\n\n<Assistant>\nYou are an assistant that creates questions for Jeopardy.\n</Assistant>\n\n<User>\nMake a question about United States history.\n</User>\n\n<Request\n  model=\"gpt-3.5-turbo\"\n  onResponse={async ({ message }) => {\n    const answer = await questionAnswer({ question: message })\n    setField(answer)\n  }}\n/>",
      state: GLASS_STATE,
      interpolationArgs: opt.args || {},
      requestBlocks: [
        {
          model: 'gpt-3.5-turbo',
          onResponse: async ({ message }) => {
            const answer = await questionAnswer({ question: message })
            setField(answer)
          },
          temperature: undefined,
          maxTokens: undefined,
          stopSequence: undefined,
        },
      ],
      functions: [],
    }
  }

  const run = async (options: {
    args?: {}
    tokenCounter?: {
      countTokens: (str: string, model: string) => number
      maxTokens: (model: string) => number
      reserveCount?: number
    }
    openaiKey?: string
    anthropicKey?: string
    progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
  }) => {
    const c = await compile({ args: options.args || {} })
    return await glasslib.runGlassTranspilerOutput(c, options)
  }

  return { getTestData, compile, run }
}
