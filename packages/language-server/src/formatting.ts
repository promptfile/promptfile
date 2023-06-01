import { parseFrontmatterFromGlass } from '@glass-lang/glassc'
import { removeGlassFrontmatter } from '@glass-lang/glasslib'
import { glassElements } from './elements'

export function formatDocument(text: string) {
  // Check if the document contains any of the required tags

  const nonSelfClosingTags = glassElements.filter(e => e.selfClosing !== true)

  const tagNames = glassElements.map(e => e.name).join('|')
  const hasTags = new RegExp(`<(${tagNames})`).test(text)

  // If no tags are present, wrap the entire content in <User> </User> tags
  if (!hasTags) {
    text = `<User>\n${text}\n</User>`
  }
  const lines = text.split('\n')
  const formattedLines: string[] = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    // Check if line has any tags (with or without attributes), if yes, trim the line.
    if (new RegExp(`</?(${tagNames})(\\s+[^>]*)?>`).test(line)) {
      formattedLines.push(line.trim())
    } else {
      formattedLines.push(line)
    }
  }

  let finalText = formattedLines.join('\n').trim()
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
