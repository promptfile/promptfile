import * as fs from 'fs'
import * as path from 'path'

const currentJson = fs.readFileSync('./syntaxes/glass.tmLanguage.json', 'utf8')
const languages = [
  {
    name: 'Typescript',
    scopeName: 'glass-ts',
    source: 'source.js',
  },
  {
    name: 'Python',
    scopeName: 'glass-py',
    source: 'source.python',
  },
]

// Create the "generated" directory if it doesn't exist
if (!fs.existsSync('./syntaxes/generated')) {
  fs.mkdirSync('./syntaxes/generated', { recursive: true })
}

// loop over all languages
for (const language of languages) {
  const result = currentJson.replace(/SOURCE_LANGUAGE/g, language.source).replace(/SCOPE_NAME/g, language.scopeName)

  // Define the path for the output file
  const outputPath = path.join('syntaxes', 'generated', `${language.scopeName}.tmLanguage.json`)

  // Write the resulting text to the output file
  fs.writeFileSync(outputPath, result)
}
