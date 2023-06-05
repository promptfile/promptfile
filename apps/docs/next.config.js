const shiki = require('shiki')
const fs = require('fs')
const path = require('path')

const glassTs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../vscode-glass/syntaxes/generated/glass-ts.tmLanguage.json')).toString()
)
const glassPy = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../vscode-glass/syntaxes/generated/glass-py.tmLanguage.json')).toString()
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
          id: 'glass-ts',
          scopeName: 'source.glass-ts',
          grammar: glassTs,
          aliases: ['glass', 'glass-ts'],
        })
        await highlighter.loadLanguage({
          id: 'glass-py',
          scopeName: 'source.glass-py',
          grammar: glassPy,
          aliases: ['glass-py'],
        })
        return highlighter
      },
    },
  },
})

module.exports = withNextra()
