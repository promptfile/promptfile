const shiki = require('shiki')
const fs = require('fs')

const glassTs = JSON.parse(
  fs.readFileSync('/Users/rothfels/glass/apps/docs-next/components/glass-ts.tmLanguage.json').toString()
)
const glassPy = JSON.parse(
  fs.readFileSync('/Users/rothfels/glass/apps/docs-next/components/glass-py.tmLanguage.json').toString()
)

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  mdxOptions: {
    rehypePrettyCodeOptions: {
      getHighlighter: async options => {
        const highlighter = await shiki.getHighlighter(options)
        await highlighter.loadLanguage({
          id: 'glass-ts',
          scopeName: 'source.glass-ts',
          grammar: glassTs,
          aliases: ['glass-ts'],
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
