import { parseFrontmatterFromGlass } from '@glass-lang/glassc'
import { parseGlassDocument, removeGlassFrontmatter } from '@glass-lang/glasslib'
import * as prettier from 'prettier'
import { glassElements } from './elements'

export function formatDocument(text: string, isPython: boolean) {
  text = wrapIfNoBlocks(text)

  // Check if the document contains any of the required tags
  if (!isPython) {
    const sections = parseGlassDocument(text)
    const blocks = sections.map(s => {
      if (s.type === 'frontmatter') {
        return s
      }
      if (s.type === 'block') {
        const childContent = s.child!.content
        if (childContent.length === 0) {
          const formatted = prettify(s.content)
          return { ...s, content: formatted.startsWith(';') ? formatted.substring(1) : formatted }
        }
        const blockWithoutChild =
          s.content.substring(0, s.child!.position.start.offset - s.position.start.offset) +
          'GLASS_INNERBLOCK_SUBSTITUTION' +
          s.content.substring(s.child!.position.end.offset - s.position.start.offset)
        const formatted = prettify(blockWithoutChild)
          .replace(/\s*GLASS_INNERBLOCK_SUBSTITUTION\s*/, '\n' + childContent + '\n')
          .trim()
        return { ...s, content: formatted.startsWith(';') ? formatted.substring(1) : formatted }
      }
      if (s.content.trim().length === 0) {
        return s
      }
      let formattedCode = prettier
        .format(s.content, {
          parser: 'typescript',
          printWidth: 120,
          arrowParens: 'avoid',
          semi: false,
          singleQuote: true,
          trailingComma: 'es5',
        })
        .trim()
      // if s.content starts or ends with any whitepsace chars, add them back
      const leadingWhitespace = s.content.match(/^\s+/)
      const trailingWhitespace = s.content.match(/\s+$/)
      if (leadingWhitespace) {
        formattedCode = leadingWhitespace[0] + formattedCode
      }
      if (trailingWhitespace) {
        formattedCode = formattedCode + trailingWhitespace[0]
      }

      return { ...s, content: formattedCode }
    })
    text = blocks.map(b => b.content).join('')
  }

  const nonSelfClosingTags = glassElements.filter(e => e.selfClosing !== true)

  const tagNames = glassElements.map(e => e.name).join('|')

  const lines = text.split('\n')
  const formattedLines: string[] = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    // Check if line has any tags (with or without attributes), if yes, trim the line.
    if (new RegExp(`</?(${tagNames})(\\s+[^>]*)?>`).test(line)) {
      formattedLines.push(line.trim())
    } else {
      formattedLines.push(line)
    }
  }

  let finalText = formattedLines.join('\n').trim()
  const tags = nonSelfClosingTags.map(e => e.name)
  tags.forEach(tag => {
    const regexOpen = new RegExp(`<\\s+${tag}`, 'g')
    const regexClose = new RegExp(`${tag}\\s+>`, 'g')
    finalText = finalText.replace(regexOpen, `<${tag}`).replace(regexClose, `${tag}>`)
  })

  // Correctly format tag attributes and self-closing tags
  finalText = finalText.replace(/<(\w+)(\s+[^>]*?)(\/?)\s*>/g, (match, p1, p2, p3) => {
    // Trim trailing spaces from attributes and reassemble the tag
    return p3 ? `<${p1}${p2.trimEnd()} ${p3}>` : `<${p1}${p2.trimEnd()}>`
  })

  try {
    const frontmatter = parseFrontmatterFromGlass(finalText)
    if (frontmatter == null) {
      finalText = removeGlassFrontmatter(finalText)
    }
  } catch {
    // Ignore errors
  }

  return finalText.trim()
}

function wrapIfNoBlocks(text: string) {
  const tagNames = glassElements.map(e => e.name).join('|')
  const hasTags = new RegExp(`<(${tagNames})`).test(text)

  // If no tags are present, wrap the entire content in <User> </User> tags
  if (!hasTags) {
    return `<User>\n${text}\n</User>`
  }

  return text
}

function prettify(code: string) {
  return prettier.format(code, {
    parser: 'typescript',
    printWidth: 120,
    arrowParens: 'avoid',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
  })
}
