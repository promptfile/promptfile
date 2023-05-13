import ts from 'typescript'

const typescriptGlobals = new Set(['fetch', 'Math', 'Date', 'JSON', 'console'])

export function parseCodeBlock(code: string) {
  const importedSymbols = new Set(parseCodeImportedSymbols(code))
  const symbolsAddedToScope = parseCodeBlockLocalVars(code)
  const undeclaredSymbols = parseCodeBlockUndeclaredSymbols(code)
  const undeclaredValuesNeededInScope = undeclaredSymbols.filter(
    value => !importedSymbols.has(value) && !typescriptGlobals.has(value)
  )
  const isAsync = codeBlockContainsAwait(code)
  return { symbolsAddedToScope, undeclaredValuesNeededInScope, importedSymbols: Array.from(importedSymbols), isAsync }
}

export function parseCodeBlockLocalVars(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  const variableNames: string[] = []

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node)) {
      if (ts.isIdentifier(node.name)) {
        variableNames.push(node.name.text)
      } else if (ts.isObjectBindingPattern(node.name)) {
        for (const element of node.name.elements) {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            variableNames.push(element.name.text)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return variableNames
}

export function parseCodeBlockUndeclaredSymbols(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  const undeclaredValues = new Set<string>()

  function visit(node: ts.Node) {
    if (
      ts.isIdentifier(node) &&
      !ts.isPropertyAccessExpression(node.parent) &&
      !(ts.isPropertyAssignment(node.parent) && node.parent.name === node)
    ) {
      const symbol = checker.getSymbolAtLocation(node)
      const declarations = symbol?.getDeclarations() || []

      let isDeclared = false
      for (const declaration of declarations) {
        if (
          ts.isVariableDeclaration(declaration) ||
          ts.isFunctionDeclaration(declaration) ||
          ts.isImportSpecifier(declaration) ||
          ts.isImportClause(declaration)
        ) {
          isDeclared = true
          break
        }
      }

      if (!isDeclared) {
        undeclaredValues.add(node.text)
      }
    }
    ts.forEachChild(node, visit)
  }

  const compilerOptions = ts.getDefaultCompilerOptions()
  const program = ts.createProgram({
    rootNames: [sourceFile.fileName],
    options: compilerOptions,
    host: {
      ...ts.createCompilerHost(compilerOptions),
      getSourceFile: fileName => (fileName === sourceFile.fileName ? sourceFile : undefined),
    },
  })
  const checker = program.getTypeChecker()
  visit(sourceFile)
  return Array.from(undeclaredValues)
}

/**
 * Takes a code block like:
 *
 * ```
 * import {foo, bar} from './someFile'
 * import * as something from './someOtherFile'
 * import baz from 'baz'
 * ```
 *
 * And returns the values added to the scope by the imports, i.e. ['foo', 'bar', 'something', 'baz']
 */
export function parseCodeImportedSymbols(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  const importedSymbols: string[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const importClause = node.importClause

      if (importClause) {
        if (importClause.namedBindings) {
          if (ts.isNamedImports(importClause.namedBindings)) {
            for (const element of importClause.namedBindings.elements) {
              importedSymbols.push(element.name.text)
            }
          } else if (ts.isNamespaceImport(importClause.namedBindings)) {
            importedSymbols.push(importClause.namedBindings.name.text)
          }
        }

        if (importClause.name) {
          importedSymbols.push(importClause.name.text)
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return importedSymbols
}

export function codeBlockContainsAwait(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  let hasAwait = false

  function visit(node: ts.Node) {
    if (ts.isAwaitExpression(node)) {
      hasAwait = true
    } else {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)
  return hasAwait
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
              return `${attrName}={JSON.stringify(\${${expression.getText()}})}`
            }
          } else if (initializer && ts.isStringLiteral(initializer)) {
            return `${attrName}=${initializer.getText()}`
          }
        }
        return ''
      })
      .join(' ')

    const children = ts.isJsxElement(node) ? node.children.map(transformJsxExpressionToTemplate).join('') : ''

    return `<${tagName}${attributes ? ' ' + attributes : ''}>${children}</${tagName}>`
  } else if (ts.isJsxText(node)) {
    return node.text
  } else {
    return ''
  }
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
