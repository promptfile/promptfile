import { languageModels } from './languageModels'

interface GlassElement {
  name: string
  attributes: GlassAttribute[]
  detail?: string
  documentation?: string
  insertText?: string
  selfClosing?: boolean
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
    name: 'Args',
    attributes: [],
    selfClosing: true,
  },
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
      // {
      //   name: 'generated',
      //   detail: 'whether the Assistant block is generated',
      //   documentation: 'The `generated` attribute allows you to assign a generated flag to an assistant.',
      //   type: 'boolean',
      //   optional: true,
      // },
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render an Assistant block.',
        optional: true,
      },
    ],
  },
  {
    name: 'Block',
    insertText: 'Block role="$1" content="$2" />',
    documentation: 'Creates a chat block',
    detail: '(block) chat block',
    attributes: [
      {
        name: 'role',
        detail: 'system, user, or assistant',
        documentation: 'The `role` attribute allows you to assign a role to a chat block.',
        values: [
          {
            name: 'system',
            detail: 'system chat block',
            documentation: 'The `system` role is used for system chat blocks.',
          },
          {
            name: 'user',
            detail: 'user chat block',
            documentation: 'The `user` role is used for user chat blocks.',
          },
          {
            name: 'assistant',
            detail: 'assistant chat block',
            documentation: 'The `assistant` role is used for assistant chat blocks.',
          },
        ],
        type: 'enum',
      },
      {
        name: 'content',
        detail: 'content of the chat block',
        documentation: 'The `content` attribute allows you to assign string content to a chat block.',
        type: 'string',
      },
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render a block.',
        optional: true,
      },
    ],
  },
  {
    name: 'For',
    documentation: 'Creates a for loop',
    detail: '(element) loop over elements in an array',
    attributes: [
      {
        name: 'each',
        detail: 'array to iterate over',
        documentation: 'The `each` attribute defines the array you want to iterate over.',
        type: 'array',
      },
      {
        name: 'item',
        detail: 'alias for each item in the array',
        documentation: 'The `item` attribute defines the alias for each item in the array.',
        type: 'string',
      },
    ],
  },
  {
    name: 'Prompt',
    documentation: 'Creates a Prompt tag with inner content',
    detail: '(element) raw Glass prompt block',
    attributes: [],
  },
  {
    name: 'Request',
    documentation: 'Creates a model inference',
    detail: '(inference) API request to a model',
    selfClosing: true,
    attributes: [
      {
        name: 'model',
        detail: 'model for inference',
        documentation: 'The `model` attribute determines which model to inference',
        type: 'enum',
        values: languageModels,
      },
      {
        name: 'temperature',
        detail: 'temperature for inference',
        documentation: 'The `temperature` attribute determines the temperature for inference',
        type: 'number',
        optional: true,
      },
      {
        name: 'maxTokens',
        detail: 'max tokens for inference',
        documentation: 'The `maxTokens` attribute determines the max tokens for inference',
        type: 'number',
        optional: true,
      },
      {
        name: 'onResponse',
        detail: 'callback for response',
        documentation: 'The `onResponse` attribute allows you to define a callback for the response.',
        type: 'function',
        optional: true,
      },
    ],
  },
  {
    name: 'State',
    insertText: 'State>\n{\n\t"$1": "$2"\n}\n</State>',
    documentation: 'Creates a State tag to hold document state',
    detail: '(element) holds document state',
    attributes: [],
  },
  {
    name: 'System',
    documentation: 'Creates a System chat block with inner content',
    detail: '(element) raw Glass text block',
    attributes: [
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render a System block.',
        optional: true,
      },
    ],
  },
  {
    name: 'Test',
    documentation: 'Creates a Test tag to hold test cases',
    detail: '(element) holds test cases',
    attributes: [],
  },
  {
    name: 'Text',
    attributes: [
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render text.',
        optional: true,
      },
    ],
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
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render a User block.',
        optional: true,
      },
    ],
  },
]
