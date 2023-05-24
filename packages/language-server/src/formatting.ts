import { parseFrontmatterFromGlass } from '@glass-lang/glassc'
import { removeGlassFrontmatter } from '@glass-lang/glasslib'
import { glassElements } from './elements'

export function formatDocument(text: string) {
  // Check if the document contains any of the required tags

  const nonSelfClosingTags = glassElements.filter(e => e.selfClosing !== true)

  const tagNames = glassElements.map(e => e.name).join('|')
  const hasTags = new RegExp(`<(${tagNames})`).test(text)

  // If no tags are present, wrap the entire content in <Prompt> </Prompt> tags
  if (!hasTags) {
    text = `<Prompt>\n${text}\n</Prompt>`
  }
  const lines = text.split('\n')
  const formattedLines: string[] = []
  let insertEmptyLine = false

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const isClosingTag = line.match(/^<\/(User|System|Assistant|Prompt|State|Text)/)
    const isOpeningTag = line.match(/^<(User|System|Assistant|Prompt|State|Text)/)

    if (isOpeningTag && insertEmptyLine) {
      if (formattedLines[formattedLines.length - 1].trim() !== '') {
        formattedLines.push('')
      }
      insertEmptyLine = false
    }

    formattedLines.push(line)

    if (isClosingTag) {
      insertEmptyLine = true
    }
  }

  // Remove consecutive empty lines
  const cleanedLines = formattedLines.filter((line, index) => {
    if (index === 0 || index === formattedLines.length - 1) return true
    return !(line.trim() === '' && formattedLines[index - 1].trim() === '')
  })

  let finalText = cleanedLines.join('\n').trim()
  const tags = nonSelfClosingTags.map(e => e.name)
  tags.forEach(tag => {
    const regexOpen = new RegExp(`<\\s+${tag}`, 'g')
    const regexClose = new RegExp(`${tag}\\s+>`, 'g')
    finalText = finalText.replace(regexOpen, `<${tag}`).replace(regexClose, `${tag}>`)
  })

  // Correctly format tag attributes and self-closing tags
  finalText = finalText.replace(/<(\w+)(\s+[^>]*?)(\/?)\s*>/g, (match, p1, p2, p3) => {
    // Trim trailing spaces from attributes and reassemble the tag
    return p3 ? `<${p1}${p2.trimEnd()} ${p3}>` : `<${p1}${p2.trimEnd()}>`
  })

  try {
    const frontmatter = parseFrontmatterFromGlass(finalText)
    if (frontmatter == null) {
      finalText = removeGlassFrontmatter(finalText)
    }
  } catch {
    // Ignore errors
  }

  return finalText.trim()
}
