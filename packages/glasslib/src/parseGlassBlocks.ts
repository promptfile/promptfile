import { checkOk } from '@glass-lang/util'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

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

export function parseGlassDocument(doc: string, strict: boolean): GlassContent[] {
  const blocks = strict ? parseGlassBlocksStrict(doc) : parseGlassBlocks(doc)

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
        type: 'code',
        position: { start: { offset: start }, end: { offset: block.position.start.offset } },
        content: doc.substring(start, block.position.start.offset),
      })
    }

    start = block.position.end.offset
  }

  if (start < doc.length) {
    nonBlocks.push({
      type: 'code',
      position: { start: { offset: start }, end: { offset: doc.length } },
      content: doc.substring(start, doc.length),
    })
  }

  const content = [...blocks, ...nonBlocks].sort((a, b) => a.position.start.offset - b.position.start.offset)

  return content
}

const tags = [
  'Assistant',
  'User',
  'System',
  'For',
  'Block',
  'Request',
  'Chat',
  'Test',
  'Text',
  'Transcript',
  'State',
  'Args',
]

export function parseGlassBlocks(str: string): BlockContent[] {
  const tagsPattern = tags.join('|')
  const regex = new RegExp(
    `<(${tagsPattern})\\s*[^\\n]*\\/?>|<(${tagsPattern})\\s*[^\\n]*>((?:(?!<\\/\\2>)[\\s\\S])*?)<\\/\\2>`,
    'g'
  )

  let match
  const blocks: BlockContent[] = []

  while ((match = regex.exec(str)) !== null) {
    const tag = match[1] || match[2]
    const childContent = match[3] ? match[3].trim() : ''
    const start = match.index
    const end = start + match[0].length

    // calculate the child position
    let childStart, childEnd
    if (childContent !== '') {
      childStart = str.indexOf(childContent, start)
      childEnd = childStart + childContent.length
    } else {
      childStart = end - 2 // '/>' position
      childEnd = end - 2 // '/>' position
    }

    blocks.push({
      type: 'block',
      tag,
      position: { start: { offset: start }, end: { offset: end } },
      content: str.substring(start, end),
      child: {
        content: childContent,
        position: { start: { offset: childStart }, end: { offset: childEnd } },
      },
      attrs: [],
    })
  }

  return blocks
  // return parseAttributes(str, blocks)
}

export function parseGlassBlocksStrict(str: string): BlockContent[] {
  // Build a regex pattern string using the provided tags
  const tagsPattern = tags.join('|')

  const regex = new RegExp(
    `(^<(${tagsPattern})\\s*[^\\n]*\\/>)|(^<(${tagsPattern})\\s*[^\\n]*>\\n?([\\s\\S]*?)<\\/\\4>)|(\\n<(${tagsPattern})\\s*[^\\n]*\\/>)|([\\n\\r]<(${tagsPattern})\\s*[^\\n]*>\\n?([\\s\\S]*?)<\\/\\8>)`,
    'gm'
  )

  let match
  const blocks: BlockContent[] = []

  while ((match = regex.exec(str)) !== null) {
    const tag = match[2] || match[4] || match[7] || match[9]
    const childContent = match[5] || match[10] ? (match[5] || match[10]).trim() : ''
    const start = match.index
    const end = start + match[0].length

    // calculate the child position
    const childStart = childContent !== '' ? str.indexOf(childContent, start) : 0
    const childEnd = childContent !== '' ? childStart + childContent.length : 0

    blocks.push({
      type: 'block',
      tag,
      content: str.substring(start, end),
      position: { start: { offset: start }, end: { offset: end } },
      child: {
        content: childContent,
        position: { start: { offset: childStart }, end: { offset: childEnd } },
      },
      attrs: [],
    })
  }

  return blocks
  // return parseAttributes(str, blocks)
}

function parseAttributes(origDoc: string, blocks: BlockContent[]) {
  return blocks.map(b => {
    let blockWithoutChildContent = b.content
    if (b.child.content) {
      blockWithoutChildContent =
        origDoc.substring(b.position.start.offset, b.child.position.start.offset) +
        origDoc.substring(b.child.position.end.offset, b.position.end.offset)
    }
    const parsedJsx = parseGlassTopLevelJsxElements(blockWithoutChildContent)
    checkOk(parsedJsx.length === 1, `Expected exactly one top level JSX element in block ${b.content}`)
    return { ...b, attrs: parsedJsx[0].attrs }
  })
}

export function reconstructGlassDocument(nodes: { content: string }[]): string {
  return nodes.map(c => c.content).join('')
}
