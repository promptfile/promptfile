/**
 * Indents all lines of the input string by the given number of spaces.
 * Useful for Python.
 */
export function indentLines(input: string, spaces: number): string {
  const indentation = ' '.repeat(spaces)
  const lines = input.split('\n')
  const indentedLines = lines.map(line => indentation + line)
  return indentedLines.join('\n')
}
