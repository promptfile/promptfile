import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken } from '@dqbd/tiktoken/lite'

const encoding = new Tiktoken(cl100k_base.bpe_ranks, cl100k_base.special_tokens, cl100k_base.pat_str)

export function countTokens(text: string) {
  const tokens = encoding.encode(text)
  return tokens.length
}
