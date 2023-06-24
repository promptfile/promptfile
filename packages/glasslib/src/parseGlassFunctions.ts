import { parseGlassBlocks } from './parseGlassBlocks'

export interface LLMFunction {
  name: string
  description: string
  parameters: any
  testValue?: string
}

export function parseGlassFunctions(text: string): LLMFunction[] {
  const elements = parseGlassBlocks(text)
  const functionsElement = elements.find(e => e.type === 'block' && e.tag === 'Functions')
  if (!functionsElement) {
    return []
  }
  const innerContent = functionsElement.child?.content ?? ''
  try {
    const parsedJson = JSON.parse(innerContent)
    if (Array.isArray(parsedJson)) {
      // parse the parsedJson as LLMFunction[]
      return parsedJson as LLMFunction[]
    }
    return []
  } catch (e) {
    // ignore
    return []
  }
}
