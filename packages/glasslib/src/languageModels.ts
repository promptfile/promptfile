export enum LanguageModelCreator {
  openai = 'openai',
  anthropic = 'anthropic',
}

export enum LanguageModelType {
  chat = 'chat',
  completion = 'completion',
  edit = 'edit',
  insert = 'insert',
}

export interface LanguageModel {
  name: string
  creator: LanguageModelCreator
  description: string
  type: LanguageModelType
  maxTokens: number
}

export const LANGUAGE_MODELS: LanguageModel[] = [
  {
    name: 'gpt-4',
    creator: LanguageModelCreator.openai,
    description:
      'More capable than any GPT-3.5 model, able to do more complex tasks, and optimized for chat. Will be updated with our latest model iteration.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'gpt-4-0314',
    creator: LanguageModelCreator.openai,
    description:
      'Snapshot of gpt-4 from March 14th 2023. Unlike gpt-4, this model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'gpt-4-32k',
    creator: LanguageModelCreator.openai,
    description:
      'Same capabilities as the base gpt-4 mode but with 4x the context length. Will be updated with our latest model iteration.',
    type: LanguageModelType.chat,
    maxTokens: 32768,
  },
  {
    name: 'gpt-4-32k-0314',
    creator: LanguageModelCreator.openai,
    description:
      'Snapshot of gpt-4-32 from March 14th 2023. Unlike gpt-4-32k, this model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: LanguageModelType.chat,
    maxTokens: 32768,
  },
  {
    name: 'gpt-3.5-turbo',
    creator: LanguageModelCreator.openai,
    description:
      'Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003. Will be updated with our latest model iteration.',
    type: LanguageModelType.chat,
    maxTokens: 4096,
  },
  {
    name: 'gpt-3.5-turbo-0301',
    creator: LanguageModelCreator.openai,
    description:
      'Snapshot of gpt-3.5-turbo from March 1st 2023. Unlike gpt-3.5-turbo, this model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: LanguageModelType.chat,
    maxTokens: 4096,
  },
  {
    name: 'text-davinci-003',
    creator: LanguageModelCreator.openai,
    description:
      'Can do any language task with better quality, longer output, and consistent instruction-following than the curie, babbage, or ada models. Also supports inserting completions within text.',
    type: LanguageModelType.completion,
    maxTokens: 4097,
  },
  {
    name: 'text-davinci-002',
    creator: LanguageModelCreator.openai,
    description:
      'Similar capabilities to text-davinci-003 but trained with supervised fine-tuning instead of reinforcement learning.',
    type: LanguageModelType.completion,
    maxTokens: 4097,
  },
  {
    name: 'code-davinci-002',
    creator: LanguageModelCreator.openai,
    description: 'Optimized for code-completion tasks.',
    type: LanguageModelType.completion,
    maxTokens: 8001,
  },
  {
    name: 'text-curie-001',
    creator: LanguageModelCreator.openai,
    description: 'Very capable, faster and lower cost than Davinci.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'text-babbage-001',
    creator: LanguageModelCreator.openai,
    description: 'Capable of straightforward tasks, very fast, and lower cost.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'text-ada-001',
    creator: LanguageModelCreator.openai,
    description: 'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'davinci',
    creator: LanguageModelCreator.openai,
    description: 'Most capable GPT-3 model. Can do any task the other models can do, often with higher quality.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'curie',
    creator: LanguageModelCreator.openai,
    description: 'Very capable, but faster and lower cost than Davinci.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'babbage',
    creator: LanguageModelCreator.openai,
    description: 'Capable of straightforward tasks, very fast, and lower cost.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'ada',
    creator: LanguageModelCreator.openai,
    description: 'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
    type: LanguageModelType.completion,
    maxTokens: 2049,
  },
  {
    name: 'claude-v1',
    creator: LanguageModelCreator.anthropic,
    description: 'Our largest model, ideal for a wide range of more complex tasks.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'claude-v1-100k',
    creator: LanguageModelCreator.anthropic,
    description:
      'An enhanced version of claude-v1 with a 100,000 token (roughly 75,000 word) context window. Ideal for summarizing, analyzing, and querying long documents and conversations for nuanced understanding of complex topics and relationships across very long spans of text.',
    type: LanguageModelType.chat,
    maxTokens: 100000,
  },
  {
    name: 'claude-instant-v1',
    creator: LanguageModelCreator.anthropic,
    description:
      'A smaller model with far lower latency, sampling at roughly 40 words/sec! Its output quality is somewhat lower than the latest claude-v1 model, particularly for complex tasks. However, it is much less expensive and blazing fast. We believe that this model provides more than adequate performance on a range of tasks including text classification, summarization, and lightweight chat applications, as well as search result summarization.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'claude-instant-v1-100k',
    creator: LanguageModelCreator.anthropic,
    description:
      'An enhanced version of claude-instant-v1 with a 100,000 token context window that retains its performance. Well-suited for high throughput use cases needing both speed and additional context, allowing deeper understanding from extended conversations and documents.',
    type: LanguageModelType.chat,
    maxTokens: 100000,
  },
  {
    name: 'claude-v1.3',
    creator: LanguageModelCreator.anthropic,
    description:
      "Compared to claude-v1.2, it's more robust against red-team inputs, better at precise instruction-following, better at code, and better and non-English dialogue and writing.",
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'claude-v1.3-100k',
    creator: LanguageModelCreator.anthropic,
    description: 'An enhanced version of claude-v1.3 with a 100,000 token (roughly 75,000 word) context window.',
    type: LanguageModelType.chat,
    maxTokens: 100000,
  },
  {
    name: 'claude-v1.2',
    creator: LanguageModelCreator.anthropic,
    description:
      'An improved version of claude-v1. It is slightly improved at general helpfulness, instruction following, coding, and other tasks. It is also considerably better with non-English languages. This model also has the ability to role play (in harmless ways) more consistently, and it defaults to writing somewhat longer and more thorough responses.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'claude-v1.0',
    creator: LanguageModelCreator.anthropic,
    description: 'An earlier version of claude-v1.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
  {
    name: 'claude-instant-v1.1-100k',
    creator: LanguageModelCreator.anthropic,
    description:
      'An enhanced version of claude-instant-v1.1 with a 100,000 token context window that retains its lightning fast 40 word/sec performance.',
    type: LanguageModelType.chat,
    maxTokens: 100000,
  },
  {
    name: 'claude-instant-v1.0',
    creator: LanguageModelCreator.anthropic,
    description: 'An earlier version of claude-instant-v1.',
    type: LanguageModelType.chat,
    maxTokens: 8192,
  },
]
