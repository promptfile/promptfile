/**
 * Takes a glass template string and un-escapes all relevant characters sequences.
 *
 * Currently the only un-escaping that's done is for `\{` and `\}`.
 */
export function unescapeGlass(doc: string) {
  return doc.replace(/\\{/g, '{').replace(/\\}/g, '}')
}
