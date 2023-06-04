// import shiki from 'shiki'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const shiki = require('shiki')
import { readFileSync } from 'fs'

const myLanguageGrammar = JSON.parse(
  readFileSync('/Users/rothfels/glass/apps/docs-next/components/glass-ts.tmLanguage.json').toString()
)

const myLanguage = {
  id: 'glass-ts',
  scopeName: 'source.glass-ts',
  grammar: myLanguageGrammar,
  aliases: ['glass', 'glass-ts'],
}

export default async function handler(req, res) {
  const code = req.body.code

  const highlighter = await shiki.getHighlighter({ langs: [myLanguage] })
  // const highlighter = await shiki.getHighlighter({})
  // await highlighter.loadLanguage(myLanguage)

  // const highlighter = await shiki.getHighlighter({
  //   theme: 'nord',
  //   langs: [
  //     {
  //       id: 'glass-ts',
  //       scopeName: 'source.glass-ts',
  //       // path: './glass-ts.tmLanguage.json', // or `plist`
  //       path: '/Users/rothfels/glass/apps/docs-next/components/glass-ts.tmLanguage.json', // or `plist`
  //     },
  //   ],
  // })

  const highlightedCode = highlighter.codeToHtml(code, { lang: 'glass-ts' })

  res.status(200).json({ highlightedCode })
}

// export async function highlightCode(code: string) {
//   const highlighter = await shiki.getHighlighter({
//     theme: 'nord',
//     langs: [
//       {
//         id: 'glass-ts',
//         scopeName: 'source.glass-ts',
//         // path: './glass-ts.tmLanguage.json', // or `plist`
//         path: '/Users/rothfels/glass/apps/docs-next/components/glass-ts.tmLanguage.json', // or `plist`
//       },
//     ],
//   })

//   return highlighter.codeToHtml(code, { lang: 'glass-ts' })
// }
