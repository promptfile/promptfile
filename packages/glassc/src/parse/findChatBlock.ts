import { checkOk } from '@glass-lang/util'
import { parseGlassTopLevelJsxElements } from './parseGlassTopLevelJsxElements'

/**
 * Takes a glass document and returns all the top-level JSX elements.
 * For example, in the the document:
 *
 * ```glass
 * <div>hello</div>
 *
 * interstitial text
 *
 * <div>world</div>
 * ```
 *
 * There are 2 top-level JSX elements: `<div>hello</div>` and `<div>world</div>`.
 *
 * The `interstitial text` is not a top-level JSX element and is ignored by this function.
 */
export function substituteChatBlock(doc: string, replacement: string) {
  const toplevelBlocks = parseGlassTopLevelJsxElements(doc)
  const chatNode = toplevelBlocks.find(n => n.tagName === 'Chat')
  checkOk(chatNode != null, `Expected to find a <Chat> block in the document, but none was found.`)

  return doc.substring(0, chatNode.position.start.offset) + replacement + doc.substring(chatNode.position.end.offset)
}
