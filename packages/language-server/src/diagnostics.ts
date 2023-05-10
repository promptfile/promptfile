export function findInvalidAttributes(text: string) {
  const invalidAttributes: { tag: string; attribute: string; start: number }[] = []

  const tagRegex = /<(User|Assistant)(\s+[^>]*)?>/g
  let tagMatch
  while ((tagMatch = tagRegex.exec(text))) {
    const tagName = tagMatch[1]
    const attributesStr = tagMatch[2]

    if (attributesStr) {
      const attributeRegex = /\s*(\w+)(?:\s*=\s*"([^"]*)")?/g
      let attributeMatch
      while ((attributeMatch = attributeRegex.exec(attributesStr))) {
        const attributeName = attributeMatch[1]
        if (tagName === 'User' || tagName === 'Assistant') {
          if (attributeName !== 'name') {
            invalidAttributes.push({
              tag: tagName,
              attribute: attributeName,
              start: tagMatch.index + tagMatch[0].indexOf(attributeName),
            })
          }
        }
      }
    }
  }

  return invalidAttributes
}

export function findUnsupportedTags(text: string): { tag: string; start: number }[] {
  const tagPattern = /<\/?([\w-]+).*?>/g
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
  const tagPattern = /<\/?(Code|User|System|Assistant|Prompt).*?>/g
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
