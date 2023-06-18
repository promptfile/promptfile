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
      {
        name: 'name',
        detail: 'name of the assistant',
        documentation: 'The `name` attribute allows you to assign a name to an assistant.',
        type: 'string',
        optional: true,
      },
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
        name: 'temperature',
        detail: 'temperature for inference',
        documentation: 'The `temperature` attribute determines the temperature for inference',
        type: 'number',
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
    documentation: 'Execute custom TypeScript code',
    detail: '(element) write custom code',
    closingType: 'nonSelfClosing',
    attributes: [],
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
    documentation: 'The result of a function call',
    closingType: 'nonSelfClosing',
    attributes: [
      {
        name: 'name',
        detail: 'name of the function call',
        documentation: 'The `name` attribute defines the name of the function which was called.',
        type: 'string',
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
    name: 'Tool',
    documentation: 'Sets a tool the Glass runtime can use',
    detail: '(element) define a tool',
    closingType: 'selfClosing',
    insertText: 'Tool name="$1" description="$2" schema={z.object({$3})} run={(arg) => $4} />',
    attributes: [
      {
        name: 'name',
        detail: 'name of the tool',
        documentation: 'The `name` attribute defines the name of the tool.',
        type: 'string',
      },
      {
        name: 'description',
        detail: 'description of the tool',
        documentation: 'The `description` attribute defines the description of the tool.',
        type: 'string',
      },
      {
        name: 'schema',
        detail: 'schema of the tool',
        documentation: 'The `schema` attribute defines the schema of the tool.',
        type: 'object',
        insertText: 'schema={z.object({$1})}',
      },
      {
        name: 'run',
        detail: 'code to run when the tool is used',
        documentation: 'The `run` attribute defines the code to run when the tool is used.',
        type: 'function',
        insertText: 'run={(arg) => {$1}}',
      },
    ],
  },
  {
    name: 'User',
    insertText: 'User>\n$1\n</User>',
    documentation: 'Creates a User tag with inner content',
    detail: '(block) chat block with role="user"',
    closingType: 'nonSelfClosing',
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
