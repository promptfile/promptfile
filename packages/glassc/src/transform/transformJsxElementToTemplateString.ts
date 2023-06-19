import ts from 'typescript'

const interpTags = new Set(['Block', 'User', 'Assistant', 'Text'])

/**
 * Transforms a JSX element to a template string. For example:
 *
 * ```tsx
 * <Block hello={m.world} foo="bar">block content ${whoa}</Block>
 * ```
 *
 * returns the string:
 *
 * ```ts
 * `<Block hello={${JSON.stringify(m.world)}} foo="bar">block content ${whoa}</Block>`
 * ```
 */
export function transformJsxElementToTemplateString(code: string) {
  const sourceFile = ts.createSourceFile('temp.tsx', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)

  function walk(node: ts.Node, depth: number): string[] {
    let lines: string[] = []
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const openingElement = ts.isJsxElement(node) ? node.openingElement : node
      const tagName = openingElement.tagName.getText()
      const attributes = openingElement.attributes.properties
        .map((attr: any) => {
          if (ts.isJsxAttribute(attr)) {
            const attrName = attr.name.getText()
            const initializer = attr.initializer
            if (initializer && ts.isJsxExpression(initializer)) {
              const expression = initializer.expression
              if (expression && (depth <= 2 || (depth === 3 && interpTags.has(tagName)))) {
                return `${attrName}={\${JSON.stringify(${expression.getText()})}}`
              } else {
                return `${attrName}={${expression!.getText()}}`
              }
            } else if (initializer && ts.isStringLiteralLike(initializer)) {
              return `${attrName}="${initializer.text}"`
            }
          }
          return ''
        })
        .filter(Boolean)
        .join(' ')

      let children = ''
      if (ts.isJsxElement(node)) {
        const innerNodes: string[] = []
        children = node.children
          .map(child => {
            if (ts.isJsxText(child)) {
              return child.text
            } else if (ts.isJsxExpression(child)) {
              if (child.expression) {
                return `{${child.expression.getText()}}`
              }
            } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
              const childLines = walk(child, depth + 1)
              innerNodes.push(childLines.join('\n'))
              return `GLASSINNERNODE_${innerNodes.length - 1}`
              // return childLines.join('\n')
            }
            return ''
          })
          .join('')

        // replace all ${.+} with \${.+} in children
        children = children.replace(/\$\{(.+)\}/g, '\\${$1}')

        // replace all @{.+} with ${.+} in children
        children = children.replace(/@\{(.+)\}/g, '${$1}')

        // replace all GLASSINNERNODE_i with innerNodes[i]
        for (let i = 0; i < innerNodes.length; i++) {
          children = children.replace(`GLASSINNERNODE_${i}`, innerNodes[i])
        }
      }

      lines.push(`<${tagName}${attributes ? ' ' + attributes : ''}>${children}</${tagName}>`)
    } else if (ts.isJsxText(node)) {
      lines.push(node.text)
    } else {
      ts.forEachChild(node, child => {
        lines = [...lines, ...walk(child, depth + 1)]
      })
    }

    return lines
  }

  const result = walk(sourceFile, 0)
  return result.join('\n')
}
