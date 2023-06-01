export interface TextBlockNode {
  type: 'text'
  value: string
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

export interface JSXNode {
  tagName?: string
  value?: string
  type?: string
  attrs: { name: string; stringValue?: string; expressionValue?: string }[]
  children: JSXNode[]
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

export type DocumentNode = JSXNode | TextBlockNode

export interface Position {
  line: number
  column: number
  offset: number
}
