interface Block {
  tag: string
  content: string
  attrs?: Record<string, string>
}

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
 * [{ tag: "System", content: "Hello world" }, { tag: "User", content: "Goodbye world" }]
 */
export function parseGlassBlocks(template: string) {
  const blocks: Block[] = []
  const lines = template.split('\n')

  let currTag: string | null = null
  let currAltTag: string | null = null
  let currTagStartLine: number | null = null
  let currContent: string | null = null
  let currAttributes: Record<string, string> = {}

  const tagRegex = /^<(Assistant|User|System|Prompt|Code|Block|Text).*>$/
  const startingTagRegex = /^<([A-Za-z0-9_]+).*$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const altTagMatch = line.match(startingTagRegex)
    if (altTagMatch) {
      // keep track of the current tag, for ending
      currAltTag = altTagMatch[1]
    }

    if (line === '</Text>') {
      continue // ignore closing </Text> tags
    }

    if (
      line === '</Assistant>' ||
      line === '</User>' ||
      line === '</System>' ||
      line === '</Prompt>' ||
      line === '</Code>' ||
      line === '</Block>' ||
      line.endsWith('/>')
    ) {
      if (!currTag && !currAltTag) {
        throw new Error(`Unbalanced closing tag ${line} (line ${i + 1})`)
      }
      if (!currTag) {
        continue // must be an alt tag, ignore
      }
      const block: Block = {
        tag: currTag,
        content: currContent || '',
      }
      if (Object.keys(currAttributes).length) {
        block.attrs = currAttributes
      }
      blocks.push(block)
      currTag = null
      currAltTag = null
      currTagStartLine = null
      currContent = null
      currAttributes = {}
      continue
    }

    const match = line.match(tagRegex)
    if (!match && !currTag) {
      // interstital content, ignore
      continue
    }

    if (match) {
      if (match[1] === 'Text') {
        continue // text just gets added to current block
      }

      if (currTag) {
        throw new Error(
          `Must complete tag <${currTag}> (line ${currTagStartLine}) before starting tag <${match[1]}> (line ${i + 1})`
        )
      }

      currTag = match[1]
      currTagStartLine = i + 1
      currContent = null

      // the line is an HTML opening tag; extract all the attributes into a Record<string, string>
      currAttributes = {}
      const attributeRegex = /(\w+)={?"([^"]+)}?"/g
      let attributeMatch
      while ((attributeMatch = attributeRegex.exec(line))) {
        currAttributes[attributeMatch[1]] = attributeMatch[2]
      }
    } else {
      if (currContent === null) {
        currContent = line
      } else {
        currContent += '\n' + line
      }
    }
  }

  return blocks
}
