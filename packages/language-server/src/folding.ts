export function findFoldableTagPairs(
  text: string
): { tag: string; start: number; end: number; closingStart: number }[] {
  const tagPattern = /<(\/?)(Code|User|System|Assistant|Prompt|For|Args|Block).*?>/g
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
