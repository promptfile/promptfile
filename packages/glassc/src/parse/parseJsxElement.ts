import ts from 'typescript'

/**
 * Takes a JSX element like this:
 *
 * ```tsx
 * <Assistant>some text with ${variable}</Assistant>
 * ```
 *
 * and returns an object like this:
 *
 * ```ts
 * {
 *    tagName: "Assistant",
 *    undeclaredVariables: ["variable"]
 * }
 * ```
 */
export function parseJsxElement(code: string) {
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
    } else if (ts.isArrowFunction(node) || ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
      const newScope = new Set<string>()
      if (node.name) {
        newScope.add(node.name.getText())
      }
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        node.parameters.forEach(param => newScope.add(param.name.getText()))
      }
      scopes.push(newScope)
      ts.forEachChild(node, visit)
      scopes.pop()
    } else if (ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node.parent)) {
      if (
        ts.isJsxAttribute(node.parent) ||
        ts.isJsxOpeningElement(node.parent) ||
        ts.isJsxSelfClosingElement(node.parent) ||
        ts.isJsxClosingElement(node.parent) ||
        ts.isPropertyAssignment(node.parent)
      ) {
        return
      }
      const inCurrentScope = scopes.some(scope => scope.has(node.text))
      if (!inCurrentScope) {
        result.undeclaredVariables.add(node.text)
      }
    } else if (ts.isPropertyAccessExpression(node)) {
      const name = node.expression.getText()
      const inCurrentScope = scopes.some(scope => scope.has(name))
      if (!inCurrentScope) {
        result.undeclaredVariables.add(name)
      }
    }

    if (ts.isBlock(node) && !ts.isArrowFunction(node)) {
      scopes.push(new Set())
      ts.forEachChild(node, visit)
      scopes.pop()
    } else if (!ts.isArrowFunction(node) && !ts.isFunctionDeclaration(node) && !ts.isFunctionExpression(node)) {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)

  return { tagNames: Array.from(result.tagNames), undeclaredVariables: Array.from(result.undeclaredVariables) }
}
