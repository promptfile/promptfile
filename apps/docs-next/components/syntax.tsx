// import shiki from 'shiki'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const shiki = require('shiki')

export async function highlightCode(code: string) {
  const highlighter = await shiki.getHighlighter({
    theme: 'nord',
    langs: [
      {
        id: 'glass-ts',
        scopeName: 'source.glass-ts',
        // path: './glass-ts.tmLanguage.json', // or `plist`
        path: '/Users/rothfels/glass/apps/docs-next/components/glass-ts.tmLanguage.json', // or `plist`
      },
    ],
  })

  return highlighter.codeToHtml(code, { lang: 'glass-ts' })
}
