import ts from 'typescript'
function transformSetStateHelper(context: ts.TransformationContext) {
  return (rootNode: ts.Node) => {
    function visitor(node: ts.Node): ts.Node {
      if (ts.isVariableDeclaration(node)) {
        const { initializer, name } = node
        if (
          initializer &&
          ts.isCallExpression(initializer) &&
          ts.isIdentifier(initializer.expression) &&
          initializer.expression.text === 'useState' &&
          ts.isArrayBindingPattern(name) &&
          name.elements.length === 2
        ) {
          const variableName = (name.elements[0] as ts.BindingElement).name.getText()
          const glassState = ts.factory.createIdentifier('GLASS_STATE')
          const newName = ts.factory.createStringLiteral(variableName)
          const newArguments = ts.factory.createNodeArray([...initializer.arguments, glassState, newName])
          return ts.factory.updateVariableDeclaration(
            node,
            name,
            undefined,
            undefined,
            ts.factory.updateCallExpression(
              initializer,
              initializer.expression,
              initializer.typeArguments,
              newArguments
            )
          )
        }
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(rootNode, visitor)
  }
}

export function transformSetState(sourceText: string): string {
  const sourceFile = ts.createSourceFile('temp.ts', sourceText, ts.ScriptTarget.Latest, true)
  const result = ts.transform(sourceFile, [transformSetStateHelper]).transformed[0] as ts.SourceFile
  const printer = ts.createPrinter()
  return printer.printFile(result)
}

function extractUseStatePairs() {
  const pairs: Record<string, string> = {}

  const visitor =
    (context: ts.TransformationContext) =>
    (rootNode: ts.Node): ts.Node => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isVariableDeclaration(node)) {
          const { initializer, name } = node
          if (
            initializer &&
            ts.isCallExpression(initializer) &&
            ts.isIdentifier(initializer.expression) &&
            initializer.expression.text === 'useState' &&
            ts.isArrayBindingPattern(name)
          ) {
            const elements = name.elements
              .filter(ts.isBindingElement)
              .map(el => (el.name as ts.Identifier).escapedText.toString())
            if (elements.length === 2) {
              pairs[elements[0]] = elements[1]
            }
          }
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  return {
    visitor,
    getPairs: () => pairs,
  }
}

export function getUseStatePairs(sourceText: string): Record<string, string> {
  const sourceFile = ts.createSourceFile('temp.ts', sourceText, ts.ScriptTarget.Latest, true)
  const extractor = extractUseStatePairs()
  ts.transform(sourceFile, [extractor.visitor])
  return extractor.getPairs()
}

function transformFunctionCalls(functionNames: string[]) {
  return (context: ts.TransformationContext) => {
    const glassContext = ts.factory.createIdentifier('GLASS_CONTEXT')

    return (rootNode: ts.Node) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isCallExpression(node)) {
          const expression = node.expression
          if (ts.isIdentifier(expression) && functionNames.includes(expression.escapedText.toString())) {
            const newExpression = ts.factory.createPropertyAccessExpression(glassContext, expression)
            return ts.factory.updateCallExpression(node, newExpression, node.typeArguments, node.arguments)
          }
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }
  }
}

export function transformSetStateCalls(sourceText: string, pairs: any): string {
  const sourceFile = ts.createSourceFile('temp.ts', sourceText, ts.ScriptTarget.Latest, true)
  // const extractor = extractUseStatePairs();
  // ts.transform(sourceFile, [extractor.visitor]);
  // const pairs = extractor.getPairs();

  const transformed = ts.transform(sourceFile, [transformFunctionCalls(Object.values(pairs))])
    .transformed[0] as ts.SourceFile
  const printer = ts.createPrinter()
  return printer.printFile(transformed)
}
