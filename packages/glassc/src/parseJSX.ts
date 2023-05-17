import ts from 'typescript'
import { JSXNode, parseGlassASTJSX } from './util/parseGlassAST'

export function parseJSXExpression(code: string) {
  const sourceFile = ts.createSourceFile('temp.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  const result = {
    tagNames: new Set<string>(),
    undeclaredVariables: new Set<string>(),
  }

  const scopes: Set<string>[] = [new Set()]

  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      result.tagNames.add(node.tagName.getText())
    } else if (ts.isVariableDeclaration(node)) {
      scopes[scopes.length - 1].add(node.name.getText())
    } else if (ts.isArrowFunction(node)) {
      const newScope = new Set(node.parameters.map(param => param.name.getText()))
      scopes.push(newScope)
      ts.forEachChild(node, visit)
      scopes.pop()
    } else if (ts.isIdentifier(node)) {
      // Check if the parent node is a JSX attribute, a JSX opening/closing element, or a PropertyAccessExpression, or a PropertyAssignment, if so, skip it
      if (
        ts.isJsxAttribute(node.parent) ||
        ts.isJsxOpeningElement(node.parent) ||
        ts.isJsxSelfClosingElement(node.parent) ||
        ts.isJsxClosingElement(node.parent) ||
        ts.isPropertyAccessExpression(node.parent) ||
        ts.isPropertyAssignment(node.parent)
      ) {
        return
      }
      const inCurrentScope = scopes.some(scope => scope.has(node.text))
      if (!inCurrentScope) {
        result.undeclaredVariables.add(node.text)
      }
    }

    if (ts.isBlock(node) && !ts.isArrowFunction(node)) {
      scopes.push(new Set())
      ts.forEachChild(node, visit)
      scopes.pop()
    } else if (!ts.isArrowFunction(node)) {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)

  return { tagNames: Array.from(result.tagNames), undeclaredVariables: Array.from(result.undeclaredVariables) }
}
export function parseJSXAttributes(source: string) {
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

function transformJsxExpressionToTemplate(node: ts.Node): string {
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

    const children = ts.isJsxElement(node) ? node.children.map(transformJsxExpressionToTemplate).join('') : ''

    return `<${tagName}${attributes ? ' ' + attributes : ''}>${children ? '\n' + children + '\n' : '\n'}</${tagName}>`
  } else if (ts.isJsxText(node)) {
    return node.text
  } else {
    return ''
  }
}

// like above expect it takes a string

export function transformJsxExpressionStringToTemplate(code: string) {
  const sourceFile = ts.createSourceFile('temp.tsx', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)

  function walk(node: ts.Node): string[] {
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
              if (expression) {
                return `${attrName}={\${JSON.stringify(${expression.getText()})}}`
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
        children = node.children
          .map(child => {
            if (ts.isJsxText(child)) {
              return child.text
            } else if (ts.isJsxExpression(child)) {
              if (child.expression) {
                return `{${child.expression.getText()}}`
              }
            } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
              const childLines = walk(child)
              return childLines.join('\n')
            }
            return ''
          })
          .join('')
      }

      lines.push(`<${tagName}${attributes ? ' ' + attributes : ''}>${children}</${tagName}>`)
    } else if (ts.isJsxText(node)) {
      lines.push(node.text)
    } else {
      ts.forEachChild(node, child => {
        lines = [...lines, ...walk(child)]
      })
    }

    return lines
  }

  const result = walk(sourceFile)
  return result.join('\n')
}

export function transformMdxDocumentToTemplateString(input: string): string {
  const jsxNodes = parseGlassASTJSX(input)

  const replacementMap: Record<string, string> = {}

  let transformedDoc = input

  for (let i = 0; i < jsxNodes.length; i++) {
    const node = jsxNodes[i]
    const docSlice = input.slice(node.position.start.offset, node.position.end.offset)
    const replacement = transformJsxExpressionStringToTemplate(docSlice)
    replacementMap[`!##GLASS-${i}`] = replacement
    transformedDoc = transformedDoc.replace(docSlice, `!##GLASS-${i}`)
  }

  for (const [key, value] of Object.entries(replacementMap)) {
    transformedDoc = transformedDoc.replace(key, value)
  }

  return transformedDoc
  // return transformedDoc.replace(/\$\{(.+?)\}/g, '\\${$1}')
}

export function transformArrowFunctionExpressionWithJsx(input: string): string {
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

      const template = transformJsxExpressionToTemplate(jsxExpression)

      output = `${parameter} => \`${template}\``
    }
  })

  return output
}

export function jsxNodeToString(node: JSXNode) {
  const attrs = node.attrs.map(attr => {
    return `${attr.name}=${attr.stringValue != null ? `"${attr.stringValue}"` : `{${attr.expressionValue}}`}`
  })

  return `<${node.tagName} ${attrs.join(' ')} />`
}
