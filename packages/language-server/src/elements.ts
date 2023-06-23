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
    closingType: 'nonSelfClosing',
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
    closingType: 'nonSelfClosing',
    attributes: [],
  },
  {
    name: 'Tool',
    documentation: 'Sets a tool the LLM can use',
    detail: '(element) define a tool',
    closingType: 'selfClosing',
    insertText: 'Tool name="$1" description="$2" parameters={z.object({$3})} run={(arg) => $4} />',
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
        optional: true,
        type: 'string',
      },
      {
        name: 'parameters',
        detail: 'parameters of the tool',
        documentation:
          'The `parameters` attribute defines the parameters of the tool with JSON schema (https://json-schema.org/understanding-json-schema/)',
        type: 'object',
        optional: true,
        insertText: 'parameters={{}}',
      },
      // {
      //   name: 'run',
      //   detail: 'code to run when the tool is used',
      //   documentation: 'The `run` attribute defines the code to run when the tool is used.',
      //   type: 'function',
      //   optional: true,
      //   insertText: 'run={(arg) => {$1}}',
      // },
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
    ],
  },
]
