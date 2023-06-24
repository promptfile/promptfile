export interface LLMRequest {
  model: string
  temperature?: number
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  function_call?: { name: string; arguments: string } | null
}
