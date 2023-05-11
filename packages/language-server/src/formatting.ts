export function formatDocument(text: string) {
  // Check if the document contains any of the required tags
  const hasTags = /<(Prompt|User|System|Assistant|Code)/.test(text)

  // If no tags are present, wrap the entire content in <Prompt> </Prompt> tags
  if (!hasTags) {
    text = `<Prompt>\n${text}\n</Prompt>`
  }
  let lines = text.split('\n')
  const formattedLines: string[] = []
  let insertEmptyLine = false

  // Trim leading empty lines
  while (lines.length && lines[0].trim() === '') {
    lines = lines.slice(1)
  }

  // Trim trailing empty lines
  while (lines.length && lines[lines.length - 1].trim() === '') {
    lines = lines.slice(0, -1)
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const isClosingTag = line.match(/^<\/(User|System|Assistant|Code|Prompt)/)
    const isOpeningTag = line.match(/^<(User|System|Assistant|Code|Prompt)/)

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

  return cleanedLines.join('\n')
}
