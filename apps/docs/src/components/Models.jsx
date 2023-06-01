import { Heading } from '@/components/Heading'
import logoAnthropic from '@/images/logos/anthropic.svg'
import logoOpenAI from '@/images/logos/openai.svg'
import Image from 'next/image'

const supportedmodels = [
  {
    href: '#',
    name: 'OpenAI',
    description:
      'OpenAI is an AI research and deployment company. Their mission is to ensure that artificial general intelligence benefits all of humanity.',
    logo: logoOpenAI,
    active: true,
  },
  {
    href: '#',
    name: 'Anthropic',
    description:
      'Anthropic is an AI safety startup. They are focused on developing techniques for Constitutional AI to ensure artificial agents are helpful, harmless, and honest.',
    logo: logoAnthropic,
    active: true,
  },
]

export function Models() {
  return (
    <div className="my-19 xl:max-w-none">
      <Heading level={2} id="official-libraries">
        Supported models
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3">
        {supportedmodels.map(model => (
          <div key={model.name} className="flex flex-row-reverse gap-10">
            <div className="flex-auto">
              <div className="flex">
                <h3 className="pr-2 text-sm font-semibold text-zinc-900 dark:text-white">{model.name}</h3>
                {!model.active && (
                  <span class="text-2xs inline-flex items-center rounded-full bg-gray-500 px-2.5 py-0.5 font-medium text-gray-900 opacity-50">
                    coming soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{model.description}</p>
            </div>
            <Image src={model.logo} alt="" className="h-24 w-24" unoptimized />
          </div>
        ))}
      </div>
    </div>
  )
}
