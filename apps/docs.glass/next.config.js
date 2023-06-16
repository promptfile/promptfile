const shiki = require('shiki')
const fs = require('fs')
const path = require('path')

const glass = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../vscode-glass/syntaxes/glass.tmLanguage.json')).toString()
)

const syntaxTheme = JSON.parse(fs.readFileSync(path.join(__dirname, 'shiki-theme.json')).toString())

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  mdxOptions: {
    rehypePrettyCodeOptions: {
      theme: syntaxTheme,
      getHighlighter: async options => {
        const highlighter = await shiki.getHighlighter(options)
        await highlighter.loadLanguage({
          id: 'glass',
          scopeName: 'source.glass',
          grammar: glass,
          aliases: ['glass'],
        })
        return highlighter
      },
    },
  },
})

module.exports = withNextra()
