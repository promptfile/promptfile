import { ChatBlock } from '@glass-lang/glasslib'
import { DEFAULT_TOKEN_COUNTER, TokenCounter } from '@glass-lang/glasslib/'
import { LLMResponse } from './runPrompt'
import { handleStream } from './stream'

export async function runPromptAnthropic(
  messages: ChatBlock[],
  anthropicKey: string,
  model: string,
  options: {
    tokenCounter?: TokenCounter
    progress?: (data: { nextGlassfile: string; response: ChatBlock[] }) => void
  }
): Promise<{
  response: ChatBlock[]
  nextGlassfile: string
}> {
  let anthropicQuery = ''
  for (const msg of messages) {
    if (msg.role === 'assistant') {
      anthropicQuery += `\n\nAssistant: ${msg.content}`
    } else if (msg.role === 'user') {
      anthropicQuery += `\n\nHuman: ${msg.content}`
    } else if (msg.role === 'system') {
      anthropicQuery += `\n\nHuman: ${msg.content}`
    } else {
      throw new Error(`Unknown role for anthropic  query: ${msg.role}`)
    }
  }
  anthropicQuery += '\n\nAssistant: '

  const tokenCounter = options.tokenCounter || DEFAULT_TOKEN_COUNTER

  const requestTokens = tokenCounter.countTokens(anthropicQuery, model)

  const r = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      'X-API-Key': anthropicKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: anthropicQuery,
      max_tokens_to_sample: 2048,
      stopSequences: ['Human:', 'Assistant:'],
      stream: true,
    }),
  })

  const response = await handleStream(r, handleAnthropicChunk, next => {
    if (!r.ok) {
      throw new Error(`HTTP error: ${r.status}`)
    }
    if (options?.progress) {
      const responseTokens = tokenCounter.countTokens(next.content, model)
      return options.progress(
        handleRequestNode(
          interpolatedDoc,
          {
            newBlockIds,
            responseData: responseData.concat([[{ response: next.content.trim(), requestTokens, responseTokens }]]),
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
}

function handleAnthropicChunk(currResult: LLMResponse, eventData: { completion: string }) {
  if (eventData.completion) {
    return { content: eventData.completion }
  }
  return currResult
}
