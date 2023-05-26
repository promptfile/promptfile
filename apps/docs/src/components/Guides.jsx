import { Button } from '@/components/Button'

const guides = [
  {
    href: '/quickstart',
    name: 'Quickstart',
    description: 'Get started with Glass in under 5 minutes.',
  },
  {
    href: '/languages',
    name: 'Language support',
    description: 'Learn how to transpile Glass into your language of choice.',
  },
  {
    href: '/vscode',
    name: 'VS Code extension',
    description:
      'Get syntax highlighting and code completion for Glass in VS Code.',
  },
  {
    href: '/execution',
    name: 'Code execution',
    description:
      'Glass can execute generated code in a safe, sandboxed environment.',
  },
]

export function Guides() {
  return (
    <div className="my-16 xl:max-w-none" id="guides">
      <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-4">
        {guides.map((guide) => (
          <div key={guide.href}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {guide.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {guide.description}
            </p>
            <p className="mt-4">
              <Button href={guide.href} variant="text" arrow="right">
                Read more
              </Button>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
