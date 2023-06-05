import { ICards } from '@/types/SVGTypes'

export const languages: ICards = {
  typescript: {
    title: 'TypeScript',
    image: 'typescript',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
    },
    description:
      'Typescript (TS) is a strict syntactical superset of JavaScript and adds optional static typing to the language. It is designed for the development of large applications and transpiles to JavaScript.',
    href: 'https://www.typescriptlang.org/',
  },
  javascript: {
    title: 'JavaScript',
    image: 'javascript',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
      fill: '#f0f0f0',
    },
    description:
      'JavaScript (JS) is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions.',
    href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Language_overview',
  },
  python: {
    title: 'Python',
    image: 'python',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
      fill: '#f0f0f0',
    },
    description:
      'Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.',
    href: 'https://www.python.org/',
  },
  ruby: {
    title: 'Ruby (coming soon)',
    image: 'ruby',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
      fill: '#f0f0f0',
    },
    description:
      'Ruby is an interpreted, high-level, general-purpose programming language designed with an emphasis on programming productivity and simplicity.',
    href: 'https://www.ruby-lang.org/',
  },
  go: {
    title: 'Go (coming soon)',
    image: 'golang',
    lightIcon: {
      width: 24,
    },
    darkIcon: {
      width: 24,
    },
    description:
      'Go is a statically typed, compiled high-level programming language with memory safety, garbage collection, structural typing, and CSP-style concurrency.',
    href: 'https://go.dev/',
  },
}
