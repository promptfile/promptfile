export function findInvalidAttributes(text: string) {
  const invalidAttributes: { tag: string; attribute: string; start: number }[] = []

  const tagRegex = /<(\w+)(\s+[^>]*)?>/g
  let tagMatch
  while ((tagMatch = tagRegex.exec(text))) {
    const tagName = tagMatch[1]
    const attributesStr = tagMatch[2]

    if (attributesStr) {
      const attributeRegex = /\s*(\w+)(?:\s*=\s*"([^"]*)")?/g
      let attributeMatch
      while ((attributeMatch = attributeRegex.exec(attributesStr))) {
        const attributeName = attributeMatch[1]

        let isInvalidAttribute = false

        switch (tagName) {
          case 'User':
          case 'Assistant':
            if (attributeName !== 'name') {
              isInvalidAttribute = true
            }
            break
          case 'Code':
            if (attributeName !== 'language') {
              isInvalidAttribute = true
            }
            break
          default:
            isInvalidAttribute = true
        }

        if (isInvalidAttribute) {
          invalidAttributes.push({
            tag: tagName,
            attribute: attributeName,
            start: tagMatch.index + tagMatch[0].indexOf(attributeName),
          })
        }
      }
    }
  }

  return invalidAttributes
}

export function findUnsupportedTags(text: string): { tag: string; start: number }[] {
  const tagPattern = /^<\/?([\w-]+).*?>/g
  const supportedTags = new Set(['Code', 'User', 'System', 'Assistant', 'Prompt'])
  const unsupportedTags: { tag: string; start: number }[] = []

  let match
  while ((match = tagPattern.exec(text))) {
    const tag = match[1]

    if (!supportedTags.has(tag)) {
      unsupportedTags.push({ tag, start: match.index })
    }
  }

  return unsupportedTags
}

export function findUnmatchedTags(text: string): { tag: string; start: number }[] {
  const tagPattern = /^<\/?(Code|User|System|Assistant|Prompt)(\s+[^>]*)?>/gm
  const tagStack: { tag: string; start: number }[] = []
  const unmatchedTags: { tag: string; start: number }[] = []

  let match
  while ((match = tagPattern.exec(text))) {
    const isOpeningTag = match[0][1] !== '/'
    const tag = match[1]

    if (isOpeningTag) {
      tagStack.push({ tag, start: match.index })
    } else {
      const lastOpeningTag = tagStack.pop()
      if (!lastOpeningTag || lastOpeningTag.tag !== tag) {
        if (lastOpeningTag) {
          unmatchedTags.push(lastOpeningTag)
          tagStack.push(lastOpeningTag)
        }
        unmatchedTags.push({ tag: `/${tag}`, start: match.index })
      }
    }
  }

  // Add any remaining unmatched opening tags
  unmatchedTags.push(...tagStack)

  return unmatchedTags
}

function isInvalidLine(line: string): boolean {
  const trimmedLine = line.trim()

  // Check if the line is a comment, import, or export line
  if (
    trimmedLine.length === 0 ||
    trimmedLine.startsWith('//') ||
    trimmedLine.startsWith('import') ||
    trimmedLine.startsWith('export')
  ) {
    return false
  }

  // Check if the line is inside a valid element or contains a valid element with attributes
  const openTagCount = (line.match(/^<(User|Assistant|System|Prompt|Code)(\s+[^>]*)?>/g) || []).length
  const closeTagCount = (line.match(/^<\/(User|Assistant|System|Prompt|Code)>/g) || []).length

  return openTagCount === 0 && closeTagCount === 0
}

export function findInvalidLines(text: string): { line: number; start: number; end: number }[] {
  const invalidLines: { line: number; start: number; end: number }[] = []
  const lines = text.split('\n')

  let insideValidElement = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (
      line.startsWith('<User') ||
      line.startsWith('<Assistant') ||
      line.startsWith('<System') ||
      line.startsWith('<Prompt') ||
      line.startsWith('<Code')
    ) {
      insideValidElement++
    }

    if (
      line.startsWith('</User>') ||
      line.startsWith('</Assistant>') ||
      line.startsWith('</System>') ||
      line.startsWith('</Prompt>') ||
      line.startsWith('</Code>')
    ) {
      insideValidElement--
    }

    if (!insideValidElement && isInvalidLine(line)) {
      invalidLines.push({ line: i, start: 0, end: line.length })
    }
  }

  return invalidLines
}
