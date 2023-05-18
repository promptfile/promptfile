import ts from 'typescript'

/**
 * Takes a JSX element like this:
 *
 * ```tsx
 * <Assistant foo="bar">some text with ${variable}</Assistant>
 * ```
 *
 * and returns an object like this:
 *
 * ```ts
 * {
 *    foo: "bar"
 * }
 * ```
 */
export function parseJsxAttributes(source: string) {
  // Parse the JSX string to a TypeScript AST
  const sourceFile = ts.createSourceFile(
    'jsx.tsx',
    source,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true,
    ts.ScriptKind.TSX
  )

  let attrs: Record<string, string> = {}

  // Search for the JSX element
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      // Get the attributes
      const newAttrs = node.attributes.properties.reduce((acc: { [key: string]: string }, prop) => {
        if (ts.isJsxAttribute(prop)) {
          // Get the attribute name
          const attrName = prop.name.escapedText

          // Get the attribute value (if it's a string literal)
          let attrValue = ''
          if (prop.initializer && ts.isStringLiteral(prop.initializer)) {
            attrValue = prop.initializer.text
          }

          // Add the attribute to the result
          acc[attrName!] = attrValue
        }

        return acc
      }, {})

      attrs = { ...attrs, ...newAttrs }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return attrs
}
