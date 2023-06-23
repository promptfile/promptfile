import { ChatBlock, DEFAULT_TOKEN_COUNTER, TokenCounter } from '@glass-lang/glasslib'
import { FunctionData } from '@glass-lang/glasslib/dist/parseGlassBlocks'
import { checkOk } from '@glass-lang/util'
import { handleChatChunk, handleStream } from './stream'

export async function runPromptOpenAIChat(
  messages: ChatBlock[],
  openaiKey: string,
  model: string,
  functions: FunctionData[],
  options: {
    tokenCounter?: TokenCounter
    progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
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
      functions: functions.map(f => ({
        name: f.name,
        description: f.description,
        parameters: f.parameters,
      })),
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
      const responseTokens = tokenCounter.countTokens(`<|im_start|>assistant\n${next}<|im_end|>`, model)
      return options.progress(
        handleRequestNode(
          interpolatedDoc,
          {
            newBlockIds,
            responseData:
              responseDataToAppendTo == null
                ? responseData.concat([
                    [
                      {
                        response: next.content.trim(),
                        function_call: next.function_call,
                        requestTokens,
                        responseTokens,
                      },
                    ],
                  ])
                : responseData.map((r, i) =>
                    i === responseIndex
                      ? r.concat([
                          {
                            response: next.content.trim(),
                            function_call: next.function_call,
                            requestTokens,
                            responseTokens,
                          },
                        ])
                      : r
                  ),
            requestBlocks,
            requestTokens,
            responseTokens,
            streaming: true,
            index: responseData.length,
          },
          options.id
        )
      )
    }
  })

  let functionObservation: string | undefined = undefined
  if (response.function_call != null) {
    const fn = functions.find(f => f.name === response.function_call!.name)!
    checkOk(fn, `Function ${response.function_call!.name} not found`)
    const args = JSON.parse(response.function_call!.arguments)
    const result = await fn.run(args)
    functionObservation = JSON.stringify(result, null, 2)
  }

  // TODO: handle counting tokens for function response
  const responseTokens = tokenCounter.countTokens(`<|im_start|>assistant\n${response.content}<|im_end|>`, model)

  if (responseDataToAppendTo == null) {
    responseData.push([
      {
        response: response.content.trim(),
        function_call: response.function_call,
        functionObservation,
        requestTokens,
        responseTokens,
      },
    ])
  } else {
    responseData[responseIndex].push({
      response: response.content.trim(),
      function_call: response.function_call,
      functionObservation,
      requestTokens,
      responseTokens,
    })
  }
  messagesSoFar.push(...messages)
  messagesSoFar.push({
    role: 'assistant',
    content: response.content.trim().length ? response.content.trim() : JSON.stringify(response.function_call, null, 2),
  })

  if (functionObservation) {
    messagesSoFar.push({
      role: 'function',
      content: functionObservation,
      name: response.function_call!.name,
    })

    return await runGlassChat(
      [],
      messagesSoFar,
      responseData,
      requestBlocks,
      newBlockIds,
      functions,
      interpolatedDoc,
      responseIndex, // don't increment, gotta continue
      options
    )
  }

  return handleRequestNode(
    interpolatedDoc,
    {
      newBlockIds,
      responseData,
      requestBlocks,
      requestTokens,
      responseTokens,
      streaming: false,
      index: responseData.length - 1,
    },
    options.id
  )
}
