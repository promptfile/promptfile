import { LANGUAGE_MODELS } from '@glass-lang/glasslib'

interface GlassElement {
  name: string
  attributes: GlassAttribute[]
  detail?: string
  documentation?: string
  insertText?: string
  closingType: 'selfClosing' | 'nonSelfClosing' | 'both'
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
    closingType: 'nonSelfClosing',
    attributes: [
      // {
      //   name: 'name',
      //   detail: 'name of the assistant',
      //   documentation: 'The `name` attribute allows you to assign a name to an assistant.',
      //   type: 'string',
      //   optional: true,
      // },
      {
        name: 'model',
        detail: 'model used to generate the content',
        documentation: 'The `model` attribute allows you to track which model generated the assistant text.',
        type: 'enum',
        optional: true,
        values: LANGUAGE_MODELS.filter(
          m => !m.deprecatedOn || m.deprecatedOn < new Date().toISOString().split('T')[0]
        ).map(model => ({
          name: model.name,
          detail: model.creator,
          documentation: model.description,
        })),
      },
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render an Assistant block.',
        optional: true,
      },
      {
        name: 'once',
        detail: 'only render once',
        documentation: 'The `once` attribute allows you to only render the Assistant block once.',
        type: 'boolean',
        optional: true,
      },
      {
        name: 'transcript',
        detail: 'whether the Assistant block should be added to the transcript',
        documentation: 'The `transcript` attribute allows you to optionally add the Assistant block to the transcript.',
        type: 'boolean',
        optional: true,
      },
    ],
  },
  {
    name: 'Block',
    insertText: 'Block role="$1">',
    documentation: 'Creates a chat block',
    detail: '(block) chat block',
    closingType: 'nonSelfClosing',
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
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render a block.',
        optional: true,
      },
    ],
  },
  {
    name: 'Code',
    documentation: 'Execute custom code',
    detail: '(element) write custom code',
    closingType: 'nonSelfClosing',
    attributes: [
      {
        name: 'language',
        detail: 'language of the code',
        documentation: 'The `language` attribute defines the programming language of the code.',
        type: 'enum',
        values: [
          {
            name: 'typescript',
            detail: 'TypeScript (.ts)',
            documentation: 'Sets the language of this block to TypeScript.',
          },
          {
            name: 'javascript',
            detail: 'JavaScript (.js)',
            documentation: 'Sets the language of this block to JavaScript.',
          },
        ],
      },
    ],
  },
  {
    name: 'For',
    documentation: 'Creates a for loop',
    detail: '(element) loop over elements in an array',
    closingType: 'nonSelfClosing',
    attributes: [
      {
        name: 'each',
        detail: 'array to iterate over',
        documentation: 'The `each` attribute defines the array you want to iterate over.',
        type: 'array',
      },
      {
        name: 'as',
        detail: 'name for each item in the array',
        documentation: 'The `as` attribute defines the variable name for each item in the array.',
        type: 'string',
      },
    ],
  },
  {
    name: 'Function',
    documentation: 'Sets a function the Glass runtime can call',
    detail: '(element) define a function',
    closingType: 'selfClosing',
    attributes: [
      {
        name: 'name',
        detail: 'name of the function',
        documentation: 'The `name` attribute defines the name of the function.',
        type: 'string',
      },
      {
        name: 'description',
        detail: 'description of the function',
        documentation: 'The `description` attribute defines the description of the function.',
        type: 'string',
      },
      {
        name: 'schema',
        detail: 'schema of the function',
        documentation: 'The `schema` attribute defines the schema of the function.',
        type: 'object',
        insertText: 'schema={z.object({$1})}',
      },
      {
        name: 'run',
        detail: 'code to run when the function is called',
        documentation: 'The `run` attribute defines the code to run when the function is called.',
        type: 'function',
        insertText: 'run={(arg) => {$1}}',
      },
    ],
  },
  {
    name: 'Request',
    documentation: 'Creates a model inference',
    detail: '(inference) API request to a model',
    closingType: 'selfClosing',
    attributes: [
      {
        name: 'model',
        detail: 'model for inference',
        documentation: 'The `model` attribute determines which model to inference',
        type: 'enum',
        values: LANGUAGE_MODELS.filter(
          m => m.deprecatedOn == null || m.deprecatedOn > new Date().toISOString().split('T')[0]
        ).map(model => ({
          name: model.name,
          detail: model.creator,
          documentation: model.description,
        })),
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
        insertText: 'onResponse={(response) => {$1}}',
      },
    ],
  },
  {
    name: 'State',
    insertText: 'State>\n{\n\t"$1": "$2"\n}\n</State>',
    documentation: 'Creates a State tag to hold document state',
    detail: '(element) holds document state',
    closingType: 'nonSelfClosing',
    attributes: [],
  },
  {
    name: 'System',
    documentation: 'Creates a System chat block with inner content',
    detail: '(element) raw Glass text block',
    closingType: 'nonSelfClosing',
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
    closingType: 'nonSelfClosing',
    attributes: [],
  },
  {
    name: 'Text',
    closingType: 'nonSelfClosing',
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
    name: 'Transcript',
    documentation: 'Creates a Transcript tag to hold conversation history',
    detail: '(element) holds conversation history',
    closingType: 'both',
    attributes: [],
  },
  {
    name: 'User',
    insertText: 'User>\n$1\n</User>',
    documentation: 'Creates a User tag with inner content',
    detail: '(block) chat block with role="user"',
    closingType: 'nonSelfClosing',
    attributes: [
      // {
      //   name: 'name',
      //   detail: 'name of the user',
      //   documentation: 'The `name` attribute allows you to assign a name to a user.',
      //   type: 'string',
      //   optional: true,
      // },
      {
        name: 'if',
        detail: 'conditional expression',
        documentation: 'The `if` attribute allows you to conditionally render a User block.',
        optional: true,
      },
      {
        name: 'once',
        detail: 'only render once',
        documentation: 'The `once` attribute allows you to only render the User block once.',
        type: 'boolean',
        optional: true,
      },
      {
        name: 'transcript',
        detail: 'whether the User block should be added to the transcript',
        documentation: 'The `transcript` attribute allows you to optionally add the User block to the transcript.',
        type: 'boolean',
        optional: true,
      },
    ],
  },
]
