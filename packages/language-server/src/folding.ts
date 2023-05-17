export function findFoldableTagPairs(
  text: string
): { tag: string; start: number; end: number; closingStart: number }[] {
  const tagPattern = /<(\/?)(Code|User|System|Assistant|Prompt|For|Args|Block|Text).*?>/g
  const tagStack: { tag: string; start: number }[] = []
  const tagPairs: { tag: string; start: number; end: number; closingStart: number }[] = []

  let match
  while ((match = tagPattern.exec(text))) {
    const isOpeningTag = match[1] !== '/'
    const tag = match[2]

    if (isOpeningTag) {
      tagStack.push({ tag, start: match.index })
    } else {
      const lastOpeningTag = tagStack.pop()
      if (lastOpeningTag && lastOpeningTag.tag === tag) {
        tagPairs.push({
          tag,
          start: lastOpeningTag.start,
          end: match.index + match[0].length,
          closingStart: match.index,
        })
      }
    }
  }

  return tagPairs
}

export function findMarkdownFoldingRanges(text: string): { tag: string; start: number; end: number }[] {
  const headerPattern = /^(#{1,6})[^#].*$/gm // Matches markdown headers
  const codeBlockPattern = /```[^`]*```/gms // Matches code blocks

  const ranges: { tag: string; start: number; end: number }[] = []

  let match
  while ((match = codeBlockPattern.exec(text))) {
    ranges.push({ tag: 'markdown', start: match.index, end: codeBlockPattern.lastIndex })
  }

  // Split the text into lines for processing headers
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if ((match = /^(#{1,6})[^#].*$/.exec(line))) {
      const headerLevel = match[1].length
      const start = text.indexOf(line, i > 0 ? text.indexOf(lines[i - 1]) + lines[i - 1].length : 0)
      let end = text.length // Default to end of document
      // Look for the next header of the same or higher level
      for (let j = i + 1; j < lines.length; j++) {
        if ((match = /^(#{1,6})[^#].*$/.exec(lines[j]))) {
          if (match[1].length <= headerLevel) {
            end = text.indexOf(lines[j], text.indexOf(lines[j - 1]) + lines[j - 1].length) - 1
            break
          }
        }
      }
      ranges.push({ tag: 'markdown', start: start, end: end })
    }
  }

  return ranges
}
