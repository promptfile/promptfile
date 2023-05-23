export function formatDocument(text: string) {
  // Check if the document contains any of the required tags
  const hasTags = /<(Prompt|User|System|Assistant|Code|Chat|State|Text)/.test(text)

  // If no tags are present, wrap the entire content in <Prompt> </Prompt> tags
  if (!hasTags) {
    text = `<Prompt>\n${text}\n</Prompt>`
  }
  const lines = text.split('\n')
  const formattedLines: string[] = []
  let insertEmptyLine = false

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const isClosingTag = line.match(/^<\/(User|System|Assistant|Code|Prompt|Chat|State|Text)/)
    const isOpeningTag = line.match(/^<(User|System|Assistant|Code|Prompt|Chat|State|Text)/)

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
  const tags = ['User', 'Assistant', 'System', 'Code', 'Prompt', 'Chat', 'Text', 'State']
  tags.forEach(tag => {
    const regexOpen = new RegExp(`<\\s+${tag}`, 'g')
    const regexClose = new RegExp(`${tag}\\s+>`, 'g')
    finalText = finalText.replace(regexOpen, `<${tag}`).replace(regexClose, `${tag}>`)
  })

  // Correctly format tag attributes
  finalText = finalText.replace(/<(\w+)(\s+[^>]*?)\s+>/g, (match, p1, p2) => {
    // Trim trailing spaces from attributes and reassemble the tag
    return `<${p1}${p2.trimEnd()}>`
  })

  return finalText
}
