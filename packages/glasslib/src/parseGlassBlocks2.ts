export interface TextContent {
  content: string
  position: {
    start: { offset: number }
    end: { offset: number }
  }
}

export interface BlockContent extends TextContent {
  type: 'block'
  tag: string
  child: TextContent
  attrs: { name: string; stringValue?: string; expressionValue?: string }[]
}

export interface CodeContent extends TextContent {
  type: 'code'
}

export interface FrontmatterContent extends TextContent {
  type: 'frontmatter'
}

export type GlassContent = BlockContent | CodeContent | FrontmatterContent

export function parseGlassBlocks(doc: string) {
  const blocks: BlockContent[] = []
  const lines = doc.split('\n')

  let docSoFar = ''

  const innerTagStack: string[] = []

  let currTag: string | null = null
  let currTagHasClosed = false
  let currTagFullContent: string = ''

  let currContent: string | null = null
  let currTagStartOffset = 0
  let currContentStartOffset = 0
  let currContentEndOffset = 0

  const tagOpenStartRegex = /^<([A-Za-z]+)[\s>]/
  const tagCloseRegex = /^<\/([A-Za-z]+)>$/
  const tagSelfCloseRegex = /\/>$/
  const tagEndRegex = />$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    console.log('line', line)
    if (currTag) {
      console.log('adding line to current full content')
      currTagFullContent += '\n' + line
    }

    const tagStartOpenMatch = line.match(tagOpenStartRegex)
    const tagCloseMatch = line.match(tagCloseRegex)
    const tagSelfCloseMatch = line.match(tagSelfCloseRegex)
    const tagEndRegexMatch = line.match(tagEndRegex)

    if (!tagStartOpenMatch && !currTag) {
      // interstital code, ignore
      console.log('ignoring interstitial code')
      continue
    }

    if (tagStartOpenMatch) {
      // opening tag, if we haven't started a block start one now
      if (!currTag) {
        currTag = tagStartOpenMatch[1]
        console.log('starting new tag', currTag)
        currContent = null // initialize content
        currTagFullContent = line
        currTagHasClosed = Boolean(tagEndRegexMatch)
        currTagStartOffset = docSoFar.length
      } else {
        if (!currTagHasClosed) {
          currTagHasClosed = Boolean(tagEndRegexMatch)
          console.log('tag was not yet closed, but now it', currTagHasClosed)
          if (!tagSelfCloseRegex) {
            console.log('continuing cause we dont want to add to content yet')
            continue // we've just consumed more of the opening tag, don't add to content yet
          }
        }

        // if and only if we're opening another tag with the same name as the current tag, add to inner tag stack
        if (tagStartOpenMatch[1] === currTag) {
          console.log('have nested content with same name as current tag, adding to inner tag stack')
          innerTagStack.push(currTag)
        }
        // add to content no matter what
        console.log('adding start tag to content')
        if (currContent === null) {
          currContent = line
          currContentStartOffset = docSoFar.length
          currContentEndOffset = currContentStartOffset + line.length + 1
        } else {
          currContent += '\n' + line
          currContentEndOffset += line.length + 1
        }
      }
    } else if (!tagSelfCloseMatch && !tagCloseMatch) {
      if (currTag && innerTagStack.length === 0 && (tagSelfCloseMatch || tagCloseMatch?.[0] === currTag)) {
        console.log('adding to content because not closing')
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
      console.log('popping inner tag stack')
      // closing an inner tag, ignore it
      innerTagStack.pop()
      continue
    }

    if (tagCloseMatch || tagSelfCloseMatch) {
      console.log('tag close')

      if (!currTag) {
        console.log('but no current tag, ignoring')
        continue
      }
      const block: BlockContent = {
        type: 'block',
        tag: currTag,
        attrs: [],
        content: currTagFullContent,
        position: {
          start: { offset: currTagStartOffset },
          end: { offset: docSoFar.length },
        },
        child: {
          content: currContent || '',
          position: {
            start: { offset: currContentStartOffset },
            end: { offset: currContentEndOffset },
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

  return blocks
}
