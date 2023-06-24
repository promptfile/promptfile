const shiki = require('shiki')
const fs = require('fs')
const path = require('path')

const vscodePackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../vscode-glass/package.json')).toString())

const colors = vscodePackageJson.contributes?.configurationDefaults['editor.tokenColorCustomizations'].textMateRules

const glass = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../vscode-glass/syntaxes/promptfile.tmLanguage.json')).toString()
)

const syntaxTheme = JSON.parse(fs.readFileSync(path.join(__dirname, 'shiki-theme.json')).toString())

syntaxTheme.tokenColors = [...colors, ...syntaxTheme.tokenColors]

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  mdxOptions: {
    rehypePrettyCodeOptions: {
      theme: syntaxTheme,
      getHighlighter: async options => {
        const highlighter = await shiki.getHighlighter(options)
        await highlighter.loadLanguage({
          id: 'promptfile',
          scopeName: 'source.promptfile',
          grammar: glass,
          aliases: ['prompt', 'Prompt'],
        })
        return highlighter
      },
    },
  },
})

module.exports = withNextra()
