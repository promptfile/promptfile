export function formatDocument(text: string) {
  let lines = text.split('\n')

  // Trim leading empty lines
  while (lines.length && lines[0].trim() === '') {
    lines = lines.slice(1)
  }

  // Trim trailing empty lines
  while (lines.length && lines[lines.length - 1].trim() === '') {
    lines = lines.slice(0, -1)
  }

  return lines.join('\n')
}
