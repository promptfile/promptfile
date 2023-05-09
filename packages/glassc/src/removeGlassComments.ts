// multiline regex matching "{ /* ... */ }", including single preceding newline
const COMMENT_REGEX = /\n{\/\*\s*(.|\n)*?\s*\*\/}/gm
// multiline regex matching "{ /* ... */ }" starting in the middle of a line
const INLINE_COMMENT_REGEX = /{\/\*\s*(.|\n)*?\s*\*\/}/gm
// multiline regex matching "{ /* ... */ }" at the beginning of a document (no preceding newlines), including following newlines
const START_COMMENT_REGEX = /{\/\*\s*(.|\n)*?\s*\*\/}\n/gm

/**
 * Takes a glass template string and removes all block comments.
 * Inline comments (`//`) are not removed. The inline comments that are in the interstitial areas of chat documents are already ignored.
 */
export function removeGlassComments(doc: string) {
  return doc.replace(COMMENT_REGEX, '').replace(START_COMMENT_REGEX, '').replace(INLINE_COMMENT_REGEX, '')
}
