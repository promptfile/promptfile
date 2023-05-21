interface GlassAttribute {
  name: string
  detail?: string
  documentation?: string
  optional?: boolean
  completion?: string
  values?: string[]
  type?: 'string' | 'boolean' | 'number' | 'object' | 'array' | 'function'
}

export const glassAttributes: Record<string, GlassAttribute[]> = {
  Args: [],
  Assistant: [
    {
      name: 'name',
      detail: 'name of the assistant',
      documentation: 'The `name` attribute allows you to assign a name to an assistant.',
      type: 'string',
      optional: true,
    },
  ],
  Block: [
    {
      name: 'role',
      detail: 'system, user, or assistant',
      documentation: 'The `role` attribute allows you to assign a role to a chat block.',
      values: ['system', 'user', 'assistant'],
      type: 'string',
    },
    {
      name: 'content',
      detail: 'content of the chat block',
      documentation: 'The `content` attribute allows you to assign string content to a chat block.',
      type: 'string',
    },
  ],
  Chat: [
    {
      name: 'model',
      detail: 'chat model for inference',
      documentation: 'The `model` attribute determines which chat model to inference',
      type: 'string',
      values: ['gpt-3.5-turbo', 'gpt-4'],
    },
  ],
  Code: [
    {
      name: 'language',
      detail: 'language of the code block',
      documentation: 'The `language` attribute allows you to assign a language to a code block.',
      type: 'string',
      values: ['javascript', 'typescript', 'python'],
      optional: true,
    },
  ],
  Completion: [
    {
      name: 'model',
      detail: 'completion model for inference',
      documentation: 'The `model` attribute determines which completion model to inference',
      type: 'string',
      values: ['text-davinci-003', 'ada', 'babbage'],
    },
  ],
  For: [
    {
      name: 'each',
      detail: 'array to iterate over',
      documentation: 'The `each` attribute defines the array you want to iterate over.',
      type: 'array',
      completion: 'each={}',
    },
    {
      name: 'fragment',
      detail: 'fragment to render for each item',
      documentation: 'The `fragment` attribute defines the fragment you want to render for each item.',
      type: 'function',
      completion: 'fragment={item => <Block role={item.role} content={item.content} />}',
    },
  ],
  User: [
    {
      name: 'name',
      detail: 'name of the user',
      documentation: 'The `name` attribute allows you to assign a name to a user.',
      type: 'string',
      optional: true,
    },
  ],
}
