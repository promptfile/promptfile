import { ChatBlock, DEFAULT_TOKEN_COUNTER, TokenCounter, constructGlassDocument } from '@glass-lang/glasslib'
import { FunctionData } from '@glass-lang/glasslib/dist/parseGlassBlocks'
import { checkOk } from '@glass-lang/util'
import fetch from 'node-fetch'
import { handleChatChunk, handleStream } from './stream'

export async function runPlaygroundOpenAI(
  messages: ChatBlock[],
  openaiKey: string,
  model: string,
  functions: FunctionData[],
  options: {
    tokenCounter?: TokenCounter
    progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
    getFunction?: (name: string) => Promise<any>
    execFunction?: (name: string, args: string) => Promise<any>
  }
): Promise<{
  response: ChatBlock[]
  nextGlassfile: string
}> {
  const tokenCounter = options.tokenCounter || DEFAULT_TOKEN_COUNTER

  const requestTokens = tokenCounter.countTokens(
    messages
      .concat(messages)
      .map(b => `<|im_start|>${b.role}\n${b.content}<|im_end|>`)
      .join(''),
    model
  )

  let functionArgs = {}
  if (functions.length > 0) {
    functionArgs = {
      functions: await Promise.all(
        functions.map(async f => {
          if (f.run != null && f.description != null && f.parameters != null) {
            return {
              name: f.name,
              description: f.description,
              parameters: f.parameters,
            }
          }
          checkOk(options.getFunction != null)
          return await options.getFunction(f.name)
        })
      ),
      function_call: 'auto',
    }
  }

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ ...m })),
      model: model,
      stream: true,
      ...functionArgs,
    }),
  })

  const response = await handleStream(r, handleChatChunk, next => {
    if (!r.ok) {
      throw new Error(`HTTP error: ${r.status}`)
    }
    if (options?.progress) {
      const newChatBlock: ChatBlock = {
        role: 'assistant',
        content: `${next.content.trim()}█`,
        type: next.function_call ? 'function_call' : undefined,
      }
      const nextGlassfile = constructGlassDocument(messages.concat(newChatBlock), model)
      return options.progress({
        response: [newChatBlock],
        nextGlassfile,
      })
    }
  })

  const assistantBlock: ChatBlock = {
    role: 'assistant',
    content: response.content.trim(),
    type: response.function_call ? 'function_call' : undefined,
  }
  messages.push(assistantBlock)
  if (response.function_call == null) {
    const nextGlassfile = constructGlassDocument(messages, model)
    return {
      response: [assistantBlock],
      nextGlassfile: nextGlassfile,
    }
  }
  const fn = functions.find(f => f.name === response.function_call!.name)!
  checkOk(fn, `Function ${response.function_call!.name} not found`)
  const args = JSON.parse(response.function_call!.arguments)
  let functionObservation: string
  if (fn.run != null) {
    const result = await fn.run(args)
    functionObservation = JSON.stringify(result)
  } else {
    checkOk(
      options.execFunction,
      `Function ${response.function_call!.name} not implemented, and no execFunction provided`
    )
    const result = await options.execFunction(response.function_call!.name, args)
    functionObservation = JSON.stringify(result)
  }
  const functionChatBlock: ChatBlock = {
    role: 'function',
    content: functionObservation,
    name: response.function_call!.name,
  }
  messages.push(functionChatBlock)
  return runPlaygroundOpenAI(messages, openaiKey, model, functions, options)
}
