// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/filbert.d.ts" />

import { parse } from 'filbert'

/**
 * Takes a Python code block like:
 *
 * ```py
 * foo = 1
 * bar, baz = 2, 3
 * def hello():
 *     return "world"
 * ```
 *
 * And returns all of the variables added to the scope, i.e. ['foo', 'bar', 'baz', 'hello']
 */
export function parsePythonLocalVariables(code: string) {
  const ast = parse(code)
  const variableNames: string[] = []

  function visit(node: any) {
    if (node.type === 'VariableDeclarator' && !node.id.name.startsWith('__filbert')) {
      variableNames.push(node.id.name)
    } else if (node.type === 'FunctionDeclaration') {
      variableNames.push(node.id.name)
      // Stop recursion here as we don't want to consider variables defined within the function
      return
    }

    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(visit)
        } else {
          visit(node[key])
        }
      }
    }
  }

  visit(ast)
  return variableNames
}

/**
 * Takes a Python code block like:
 *
 * ```py
 * foo = a
 * bar, baz = 2, 3
 * def hello():
 *     return b
 * ```
 *
 * And returns all of the variables that are used but not declared in scope. In the example above: i.e. ['a', 'b']
 */
export function parsePythonUndeclaredSymbols(code: string) {
  const ast = parse(code)
  const declaredNames: string[] = []
  const usedNames: string[] = []

  function visit(node: any) {
    if (node.type === 'VariableDeclarator' && !node.id.name.startsWith('__filbertTmp')) {
      declaredNames.push(node.id.name)
      if (node.init && node.init.type === 'Identifier' && !node.init.name.startsWith('__filbertTmp')) {
        usedNames.push(node.init.name)
      }
    } else if (node.type === 'FunctionDeclaration') {
      declaredNames.push(node.id.name)
    } else if (node.type === 'MemberExpression') {
      if (node.object.type === 'Identifier' && !node.object.name.startsWith('__filbertTmp')) {
        usedNames.push(node.object.name)
      }
      if (
        node.property &&
        node.property.type === 'CallExpression' &&
        node.property.callee.property.name === 'subscriptIndex'
      ) {
        node.property.arguments.forEach((arg: any) => {
          if (arg.type === 'Identifier' && !arg.name.startsWith('__filbertTmp')) {
            usedNames.push(arg.name)
          }
        })
      }
    } else if (node.type === 'ReturnStatement' && node.argument && node.argument.type === 'Identifier') {
      usedNames.push(node.argument.name)
    } else if (node.type === 'ExpressionStatement' && node.expression.type === 'Identifier') {
      usedNames.push(node.expression.name)
    }

    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(visit)
        } else {
          visit(node[key])
        }
      }
    }
  }

  visit(ast)

  const undeclaredNames: string[] = usedNames.filter(
    name => !declaredNames.includes(name) && name !== '__pythonRuntime' && !name.startsWith('__filbert')
  )
  return Array.from(new Set(undeclaredNames))
}
// /**
//  * Takes a Python code block like:
//  *
//  * ```py
//  * foo = a
//  * bar, baz = 2, 3
//  * def hello():
//  *     return b
//  * ```
//  *
//  * And returns all of the variables that are used but not declared in scope. In the example above: i.e. ['a', 'b']
//  */
// export function parsePythonUndeclaredSymbols(code: string) {
//   const ast = parse(code)
//   console.log(JSON.stringify(ast))
//   const declaredNames: string[] = []
//   const usedNames: string[] = []

//   function visit(node: any) {
//     if (node.type === 'VariableDeclarator' && !node.id.name.startsWith('__filbertTmp')) {
//       declaredNames.push(node.id.name)
//       if (node.init && node.init.type === 'Identifier' && !node.init.name.startsWith('__filbertTmp')) {
//         usedNames.push(node.init.name)
//       }
//     } else if (node.type === 'FunctionDeclaration') {
//       declaredNames.push(node.id.name)
//     } else if (node.type === 'MemberExpression') {
//       if (node.object.type === 'Identifier' && !node.object.name.startsWith('__filbertTmp')) {
//         usedNames.push(node.object.name)
//       }
//     } else if (node.type === 'ReturnStatement' && node.argument && node.argument.type === 'Identifier') {
//       usedNames.push(node.argument.name)
//     }

//     for (const key in node) {
//       if (node[key] && typeof node[key] === 'object') {
//         visit(node[key])
//       }
//     }
//   }

//   visit(ast)

//   const undeclaredNames: string[] = usedNames.filter(
//     name => !declaredNames.includes(name) && name !== '__pythonRuntime' && !name.startsWith('__filbert')
//   )
//   return undeclaredNames
// }
