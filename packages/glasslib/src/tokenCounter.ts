export interface TokenCounter {
  countTokens: (str: string, model: string) => number
  // maximum number of tokens allowable by model
  maxTokens: (model: string) => number
  // number of tokens to reserve
  reserveCount?: number
}

export const DEFAULT_TOKEN_COUNTER: TokenCounter = {
  countTokens: () => 0,
  maxTokens: () => Infinity,
}
