import { parseGlassBlocks } from './parseGlassBlocks'

export interface LLMFunction {
  name: string
  description: string
  parameters: any
  run?: (data: any) => Promise<any>
}

export function parseGlassFunctions(text: string) {
  const elements = parseGlassBlocks(text)
  const functions: LLMFunction[] = elements
    .filter(e => e.type === 'block' && e.tag === 'Tool')
    .map(e => {
      const name = e.attrs?.find(a => a.name === 'name')?.stringValue ?? ''
      const description = e.attrs?.find(a => a.name === 'description')?.stringValue ?? 'undefined'
      const parameters = e.attrs?.find(a => a.name === 'parameters')?.expressionValue ?? {}
      return { name, description, parameters }
    })
  return functions
}
