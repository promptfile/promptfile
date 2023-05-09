/**
 * Takes a glass template string and returns an array from blocks.
 *
 * The blocks are things like this:
 *
 * <System>
 * Hello world
 * </System>
 *
 * <User>
 * Goodbye world
 * </User>
 *
 * The return value is an array of objects like this:
 * [{ role: "system", content: "Hello world" }, { role: "user", content: "Goodbye world" }]
 */
export function parseGlassBlocks(template: string) {
  const blocks: { role: string; content: string }[] = []
  const lines = template.split('\n')

  let currentRole: string | null = null
  let currentContent = ''

  const roleLineRegex = /^<(Assistant|User|System)>$/

  for (const line of lines) {
    if (line === '</Assistant>' || line === '</User>' || line === '</System>') {
      if (currentRole && currentContent) {
        blocks.push({ role: currentRole.toLowerCase(), content: currentContent })
        currentRole = null
        currentContent = ''
      }
    }

    const match = line.match(roleLineRegex)
    if (match) {
      if (currentRole && currentContent) {
        blocks.push({ role: currentRole, content: currentContent })
      }
      currentRole = match[1]
      currentContent = ''
    } else {
      currentContent += (currentContent ? '\n' : '') + line
    }
  }

  if (currentRole && currentContent) {
    blocks.push({ role: currentRole, content: currentContent })
  }

  return blocks
}
