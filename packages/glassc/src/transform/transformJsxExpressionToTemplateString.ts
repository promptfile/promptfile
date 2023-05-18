import ts from 'typescript'
import { JSXNode } from '../parse/parseGlassAST'

/**
 * Transforms a JSX expression to a TypeScript template string. For example:
 *
 * ```tsx
 * m => <Block foo="bar" role={m.role} content={m.text} />
 * ```
 *
 * returns the string:
 *
 * ```ts
 * 'm => `<Block foo="bar" role={${JSON.stringify(m.role)}} content={${JSON.stringify(m.text)}}>\n</Block>`'
 * ```
 */
export function transformJsxExpressionToTemplateString(input: string): string {
  const sourceFile = ts.createSourceFile('temp.ts', input, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)

  let output = ''

  function visitNodeAndChildren(node: ts.Node, visitFn: (node: ts.Node) => void): void {
    visitFn(node)
    ts.forEachChild(node, child => visitNodeAndChildren(child, visitFn))
  }

  visitNodeAndChildren(sourceFile, node => {
    if (ts.isArrowFunction(node)) {
      const parameter = node.parameters[0]?.name.getText() || 'm'
      const jsxExpression = node.body

      const template = transformJsxElemToTemplateString(jsxExpression)

      output = `${parameter} => \`${template}\``
    }
  })

  return output
}

/**
 * Probably less good (maybe better?) version of `transformJSXElementToTemplateString`
 */
function transformJsxElemToTemplateString(node: ts.Node): string {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tagName = ts.isJsxElement(node) ? node.openingElement.tagName.getText() : node.tagName.getText()

    const attributesNode = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes

    const attributes = attributesNode.properties
      .map((attr: any) => {
        if (ts.isJsxAttribute(attr)) {
          const attrName = attr.name.getText()
          const initializer = attr.initializer
          if (initializer && ts.isJsxExpression(initializer)) {
            const expression = initializer.expression
            if (expression) {
              return `${attrName}={\${JSON.stringify(${expression.getText()})}}`
            }
          } else if (initializer && ts.isStringLiteral(initializer)) {
            return `${attrName}=${initializer.getText()}`
          }
        }
        return ''
      })
      .join(' ')

    const children = ts.isJsxElement(node) ? node.children.map(transformJsxElemToTemplateString).join('') : ''

    return `<${tagName}${attributes ? ' ' + attributes : ''}>${children ? '\n' + children + '\n' : '\n'}</${tagName}>`
  } else if (ts.isJsxText(node)) {
    return node.text
  } else {
    return ''
  }
}

export function jsxNodeToString(node: JSXNode) {
  const attrs = node.attrs.map(attr => {
    return `${attr.name}=${attr.stringValue != null ? `"${attr.stringValue}"` : `{${attr.expressionValue}}`}`
  })

  return `<${node.tagName} ${attrs.join(' ')} />`
}
