/**
 * Removes the Glass frontmatter from a document.
 *
 * E.g.
 *
 * ---
 * arg: type
 * ---
 */
export function removeGlassFrontmatter(doc: string) {
  if (!doc.startsWith('---\n')) {
    return doc
  }
  doc = doc.replace('---\n', '')
  const endIndex = doc.indexOf('\n---\n')
  if (endIndex === -1) {
    return doc
  }
  return doc.substring(endIndex + 5)
}
