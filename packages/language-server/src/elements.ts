interface GlassElement {
  name: string
  attributes: GlassAttribute[]
  detail?: string
  documentation?: string
  insertText?: string
}

interface GlassAttribute {
  name: string
  detail?: string
  documentation?: string
  optional?: boolean
  insertText?: string
  values?: GlassAttributeValue[]
  type?: 'string' | 'boolean' | 'number' | 'object' | 'array' | 'function' | 'enum'
}

interface GlassAttributeValue {
  name: string
  detail?: string
  documentation?: string
}

export const glassElements: GlassElement[] = [
  {
    name: 'Assistant',
    detail: '(block) chat block with role="assistant"',
    documentation: 'Creates an Assistant chat block with inner content',
    attributes: [
      {
        name: 'name',
        detail: 'name of the assistant',
        documentation: 'The `name` attribute allows you to assign a name to an assistant.',
        type: 'string',
        optional: true,
      },
      {
        name: 'type',
        detail: 'type of assistant response',
        documentation: 'The `type` attribute determines what kind of response came from the assistant.',
        type: 'enum',
        optional: true,
        values: [
          {
            name: 'function_call',
          },
        ],
      },
    ],
  },
  {
    name: 'Function',
    documentation: 'The result of a function call',

    attributes: [
      {
        name: 'name',
        detail: 'name of the function used in the call',
        documentation: 'The `name` attribute defines the name of the function which was called.',
        type: 'string',
      },
    ],
  },
  {
    name: 'System',
    documentation: 'Creates a System chat block with inner content',
    detail: '(element) chat block with role="system"',

    attributes: [],
  },
  {
    name: 'Functions',
    documentation: 'Establishes the functions (aka tools) the LLM can use',
    detail: '(element) define functions',

    insertText:
      'Functions>\n[\n\t{\n\t\t"name": "$1",\n\t\t"description": "$2",\n\t\t"parameters": {\n\t\t\t"type": "object",\n\t\t\t"properties": {\n\t\t\t\t"$3": {$4},\n\t\t\t}\n\t\t}\n\t}\n]\n</Functions>',
    attributes: [],
  },
  {
    name: 'User',
    insertText: 'User>\n$1\n</User>',
    documentation: 'Creates a User tag with inner content',
    detail: '(block) chat block with role="user"',

    attributes: [
      {
        name: 'name',
        detail: 'name of the user',
        documentation: 'The `name` attribute allows you to assign a name to a user.',
        type: 'string',
        optional: true,
      },
    ],
  },
]
