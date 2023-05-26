import { Heading } from '@/components/Heading'
import logoGo from '@/images/logos/go.svg'
import logoJavascript from '@/images/logos/javascript.svg'
import logoPython from '@/images/logos/python.svg'
import logoRuby from '@/images/logos/ruby.svg'
import logoTypescript from '@/images/logos/typescript.svg'
import Image from 'next/image'

const supportedLanguages = [
  {
    href: '#',
    name: 'Typescript',
    description:
      'Typescript (TS) is a strict syntactical superset of JavaScript and adds optional static typing to the language. It is designed for the development of large applications and transpiles to JavaScript.',
    logo: logoTypescript,
    active: true,
  },
  {
    href: '#',
    name: 'Javascript',
    description:
      'JavaScript (JS) is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions.',
    logo: logoJavascript,
    active: true,
  },
  {
    href: '#',
    name: 'Python',
    description:
      'Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.',
    logo: logoPython,
    active: true,
  },
  {
    href: '#',
    name: 'Go',
    description:
      'Go is a statically typed, compiled high-level programming language with memory safety, garbage collection, structural typing, and CSP-style concurrency.',
    logo: logoGo,
    active: false,
  },
  {
    href: '#',
    name: 'Ruby',
    description:
      'Ruby is an interpreted, high-level, general-purpose programming language designed with an emphasis on programming productivity and simplicity.',
    logo: logoRuby,
    active: false,
  },
  // {
  //   href: '#',
  //   name: 'PHP',
  //   description:
  //     'PHP is a general-purpose scripting language geared toward web development.',
  //   logo: logoPhp,
  //   active: false,
  // },
]

export function Libraries() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="official-libraries">
        Supported languages
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3">
        {supportedLanguages.map((language) => (
          <div key={language.name} className="flex flex-row-reverse gap-6">
            <div className="flex-auto">
              <div className="flex">
                <h3 className="pr-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  {language.name}
                </h3>
                {!language.active && (
                  <span class="inline-flex items-center rounded-full bg-gray-500 px-2.5 py-0.5 text-2xs font-medium text-gray-900 opacity-50">
                    coming soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {language.description}
              </p>
            </div>
            <Image
              src={language.logo}
              alt=""
              className="h-12 w-12"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}
