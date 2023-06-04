import ts from 'typescript'

const typescriptGlobals = new Set(['fetch', 'Math', 'Date', 'JSON', 'console'])

export function parseCodeBlock(code: string) {
  const importedSymbols = new Set(parseCodeImportedSymbols(code))
  const symbolsAddedToScope = parseCodeBlockLocalVars(code)
  const undeclaredSymbols = parseCodeBlockUndeclaredSymbols(code)
  const undeclaredValuesNeededInScope = undeclaredSymbols.filter(
    value => !importedSymbols.has(value) && !typescriptGlobals.has(value) && !new Set(symbolsAddedToScope).has(value)
  )
  const isAsync = codeBlockContainsAwait(code)
  return { symbolsAddedToScope, undeclaredValuesNeededInScope, importedSymbols: Array.from(importedSymbols), isAsync }
}

/**
 * Takes a TypeScript code block like:
 *
 * ```ts
 * const foo = 1
 * const {bar} = {bar: 2}
 * function hello() {
 *  return "world"
 * }
 * ```
 *
 * And returns all of the variables added to the scope, i.e. ['foo', 'bar', 'hello']
 */
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
      } else if (ts.isArrayBindingPattern(node.name)) {
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

/**
 * Takes a TypeScript code block like:
 *
 * ```ts
 * const foo = hello
 * const bar = (m: any) => m.doSomething() + other
 * }
 * ```
 *
 * And returns all of the symbols that are used as but not declared as variables in scope.
 *
 * In the exmaple above: ['foo', 'bar', 'other']
 */
export function parseCodeBlockUndeclaredSymbols(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  const undeclaredValues = new Set<string>()
  const scopes = [new Set<string>()]

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      scopes.push(new Set())
    }

    if (ts.isIdentifier(node)) {
      // If the identifier is part of a variable declaration on the left side,
      // it should not be considered as an undeclared symbol.
      if (
        (ts.isVariableDeclaration(node.parent) && node.parent.initializer !== node) ||
        (ts.isBindingElement(node.parent) && node.parent.initializer !== node) ||
        ts.isParameter(node.parent)
      ) {
        scopes[scopes.length - 1].add(node.text)
        return
      }

      if (
        (!ts.isPropertyAccessExpression(node.parent) || node.parent.expression === node) &&
        !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) &&
        !(ts.isPropertyAssignment(node.parent) && node.parent.name === node) &&
        !(ts.isPropertySignature(node.parent) && node.parent.name === node)
      ) {
        let isDeclared = false
        for (const scope of scopes) {
          if (scope.has(node.text)) {
            isDeclared = true
            break
          }
        }

        if (!isDeclared) {
          const symbol = checker.getSymbolAtLocation(node)
          const declarations = symbol?.getDeclarations() || []
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
      }
    }

    ts.forEachChild(node, visit)

    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      scopes.pop()
    }
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

/**
 * Takes a code block like:
 *
 * ```
 * import {foo, bar} from './someFile'
 * import * as something from './someOtherFile.glass'
 * import baz from 'baz'
 * ```
 *
 * And returns the values added to the scope by the imports from .glass files, i.e. ['something']
 */
export function parseTsGlassImports(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  const importedSymbols: { name: string; path: string }[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.getText(sourceFile)
      const importClause = node.importClause

      if (importClause && moduleSpecifier.endsWith(".glass'")) {
        if (importClause.namedBindings) {
          if (ts.isNamedImports(importClause.namedBindings)) {
            for (const element of importClause.namedBindings.elements) {
              importedSymbols.push({ name: element.name.text, path: moduleSpecifier })
            }
          } else if (ts.isNamespaceImport(importClause.namedBindings)) {
            importedSymbols.push({ name: importClause.namedBindings.name.text, path: moduleSpecifier })
          }
        }

        if (importClause.name) {
          importedSymbols.push({ name: importClause.name.text, path: moduleSpecifier })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return importedSymbols.map(s => ({ ...s, path: s.path.replace(/'/g, '').replace(/"/g, '') }))
}

export function removeImports(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)

  let imports = ''
  const importPositions: { start: number; end: number }[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      imports += node.getFullText(sourceFile)
      importPositions.push({ start: node.getStart(sourceFile), end: node.getEnd() })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Sort the import positions in reverse order to avoid shifting positions when removing text.
  importPositions.sort((a, b) => b.start - a.start)

  let trimmedCode = code
  for (const position of importPositions) {
    trimmedCode = trimmedCode.substring(0, position.start) + trimmedCode.substring(position.end)
  }

  return { imports: imports.trim(), trimmedCode: trimmedCode.trim() }
}

/**
 * Returns true if the typescript code contains an `await` expression.
 */
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

/**
 * Takes a TypeScript code block like:
 *
 * ```ts
 * const foo = 1
 * const {bar} = {bar: 2}
 * return [foo, bar]
 * ```
 *
 * And returns the return expression, e.g. "[foo, bar]"
 */
export function parseReturnExpression(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)
  let returnExpression = ''

  function visit(node: ts.Node) {
    if (ts.isReturnStatement(node)) {
      // Get the return statement's text and remove the "return" keyword
      returnExpression = node.getText(sourceFile).replace(/return /, '')
    } else {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)
  return returnExpression
}

/**
 * Takes a TypeScript code block like:
 *
 * ```ts
 * const url = "https://elliottburris.com"
 * const question = "where did elliott go to school"
 * return [{ foo: "bar"}]
 * ```
 *
 * And returns the code block with all `return` statements removed.
 */
export function removeReturnStatements(code: string): string {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true)

  const printer = ts.createPrinter()

  function transformReturnStatements(context: ts.TransformationContext) {
    return (rootNode: ts.Node) => {
      function visitor(node: ts.Node): ts.Node {
        // If the node is a return statement, remove it by not returning anything
        if (ts.isReturnStatement(node)) {
          return ts.factory.createEmptyStatement()
        }
        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitNode(rootNode, visitor)
    }
  }

  const result = ts.transform(sourceFile, [transformReturnStatements]).transformed[0] as ts.SourceFile

  return printer.printFile(result)
}
