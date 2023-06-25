import { ICards } from '@/types/SVGTypes'

export const models: ICards = {
  openai: {
    title: 'OpenAI',
    image: 'openai',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
      fill: '#FFFFFF',
    },
    description:
      'OpenAI is an AI research and deployment company. Their mission is to ensure that artificial general intelligence benefits all of humanity.',
    href: 'https://openai.com/',
  },
  anthropic: {
    title: 'Anthropic',
    image: 'anthropic',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
      fill: '#FFFFFF',
    },
    description:
      'Anthropic is an AI safety startup. They are focused on developing techniques for Constitutional AI to ensure artificial agents are helpful, harmless, and honest.',
    href: 'https://www.anthropic.com/',
  },
}
