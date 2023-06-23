interface GlassAttribute {
  name: string
  stringValue?: string
}
export interface GlassContent {
  type: 'block' | 'comment' | 'frontmatter'
  content: string
  position: {
    start: { offset: number }
    end: { offset: number }
  }
  tag?: string
  child?: {
    content: string
    position: {
      start: { offset: number }
      end: { offset: number }
    }
  }
  attrs?: GlassAttribute[]
}

/**
 * Parse a Promptfile file.
 *
 * Each part of the file is returned as a `GlassContent` object. There are three types of content:
 * - `frontmatter`: a frontmatter block may be declared at the top of the file
 * - `block`: a top-level block element (e.g. <System>, )
 * - `comment`: ignored text (between blocks)
 *
 * For chat-only blocks, use `parseChatBlocks`.
 */
export function parseGlassDocument(doc: string): GlassContent[] {
  const blocks = parseGlassBlocks(doc)

  const nonBlocks: GlassContent[] = []
  let start = 0

  for (const block of blocks) {
    if (block.position.start.offset > start) {
      const content = doc.substring(start, block.position.start.offset)
      const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---\n/)

      if (frontmatterMatch) {
        const frontmatterContent = frontmatterMatch[1]
        const frontmatterEnd = frontmatterMatch[0].length

        nonBlocks.push({
          type: 'frontmatter',
          position: { start: { offset: start }, end: { offset: start + frontmatterEnd } },
          content: doc.substring(start, frontmatterEnd),
        })

        start += frontmatterEnd
      }

      nonBlocks.push({
        type: 'comment',
        position: { start: { offset: start }, end: { offset: block.position.start.offset } },
        content: doc.substring(start, block.position.start.offset),
      })
    }

    start = block.position.end.offset
  }

  if (start < doc.length) {
    nonBlocks.push({
      type: 'comment',
      position: { start: { offset: start }, end: { offset: doc.length } },
      content: doc.substring(start, doc.length),
    })
  }

  const content = [...blocks, ...nonBlocks].sort((a, b) => a.position.start.offset - b.position.start.offset)

  return content
}

/**
 * Parses *all* block elements from a Promptfile file.
 *
 * E.g. `<System>`, `<Request>`, etc.
 *
 * For chat-only blocks, use `parseChatBlocks`.
 *
 * If parseNestedForBlocks is true, then the nested child blocks of `<For>` will be parsed instead of the `<For>` block itself.
 */
export function parseGlassBlocks(doc: string): GlassContent[] {
  const blocks: GlassContent[] = []
  const lines = doc.split('\n')

  let docSoFar = ''

  const innerTagStack: string[] = []

  let currTag: string | null = null
  let currTagHasClosed = false
  let currTagHasSelfClosed = false
  let currTagFullContent = ''

  let currContent: string | null = null
  let currTagStartOffset = 0
  let currContentStartOffset = 0
  let currContentEndOffset = 0

  const tagOpenStartRegex = /^<([A-Za-z]+)/
  const tagCloseRegex = /^<\/([A-Za-z]+)>$/
  const tagSelfCloseRegex = /\/>$/
  const tagEndRegex = />$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const tagStartOpenMatch = line.match(tagOpenStartRegex)
    const tagCloseMatch = line.match(tagCloseRegex)
    const tagSelfCloseMatch = line.match(tagSelfCloseRegex)
    const tagEndRegexMatch = line.match(tagEndRegex)

    if (!tagStartOpenMatch && !currTag) {
      // interstital code, ignore
      docSoFar += line + '\n'
      continue
    }

    if (currTag) {
      currTagFullContent += '\n' + line
    }

    if (tagStartOpenMatch) {
      // opening tag, if we haven't started a block start one now
      if (!currTag) {
        currTag = tagStartOpenMatch[1]
        currContent = null // initialize content
        currTagFullContent = line
        currTagHasClosed = Boolean(tagEndRegexMatch)
        currTagHasSelfClosed = Boolean(tagSelfCloseMatch)
        currTagStartOffset = docSoFar.length
      } else {
        if (!currTagHasClosed) {
          currTagHasClosed = Boolean(tagEndRegexMatch)
          currTagHasSelfClosed = Boolean(tagSelfCloseMatch)
          continue // Don't add to content yet
        }

        // if and only if we're opening another tag with the same name as the current tag, add to inner tag stack
        if (tagStartOpenMatch[1] === currTag) {
          innerTagStack.push(currTag)
        }
        // add to content no matter what
        if (currContent === null) {
          currContent = line
          currContentStartOffset = docSoFar.length
          currContentEndOffset = currContentStartOffset + line.length + 1
        } else {
          currContent += '\n' + line
          currContentEndOffset += line.length + 1
        }
      }
    } else if (currTag && !currTagHasClosed) {
      currTagHasClosed = Boolean(tagEndRegexMatch)
      currTagHasSelfClosed = Boolean(tagSelfCloseMatch)
    } else if (currTagHasClosed) {
      if (currTag && innerTagStack.length === 0 && tagCloseMatch?.[1] === currTag) {
        // ignore
      } else {
        // always just add to currContent if not opening tag
        if (currContent === null) {
          currContent = line
          currContentStartOffset = docSoFar.length
          currContentEndOffset = currContentStartOffset + line.length + 1
        } else {
          currContent += '\n' + line
          currContentEndOffset += line.length + 1
        }
      }
    }

    docSoFar += line + '\n'

    if (tagCloseMatch && currTag === tagCloseMatch[1] && innerTagStack.length > 0) {
      // closing an inner tag, ignore it
      innerTagStack.pop()
      continue
    }

    if (tagCloseMatch || currTagHasSelfClosed) {
      const isSame = (tagCloseMatch && tagCloseMatch[1] === currTag) || currTagHasSelfClosed

      if (!currTag || !isSame) {
        continue
      }
      const block: GlassContent = {
        type: 'block',
        tag: currTag,
        attrs: [],
        content: currTagFullContent,
        position: {
          start: { offset: currTagStartOffset },
          end: { offset: docSoFar.length - 1 },
        },
        child: {
          content: currContent || '',
          position: {
            start: { offset: currContentStartOffset },
            end: { offset: currContentEndOffset - 1 },
          },
        },
      }
      blocks.push(block)
      currTag = null
      currContent = null
      currTagFullContent = ''
      continue
    }
  }

  return parseAttributes(doc, blocks)
}

function parseAttributes(origDoc: string, blocks: GlassContent[]) {
  return blocks.map(b => {
    if (!b.child) {
      return b
    }
    let blockWithoutChildContent = b.content
    if (b.child.content) {
      blockWithoutChildContent =
        origDoc.substring(b.position.start.offset, b.child.position.start.offset) +
        origDoc.substring(b.child.position.end.offset, b.position.end.offset)
    }
    const parsedAttributes: GlassAttribute[] = []
    return { ...b, attrs: parsedAttributes }
  })
}

export function reconstructGlassDocument(nodes: { content: string }[]): string {
  return (
    nodes
      .map(c => c.content)
      // .map(c => (c.type === 'block' ? c.content + '\n' : c.content))
      .join('')
      .trim()
  )
}

export interface RequestData {
  model: string
  temperature?: number
  maxTokens?: number
  stopSequence?: string[]
  onResponse?: (data: {
    message: string
    addToDocument: (tag: string, content: string, attrs?: any) => void
    continue: () => void
  }) => Promise<any>
}
