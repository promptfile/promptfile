import prettier from 'prettier'
import { parseCodeBlockLocalVars, parseReturnExpression, removeReturnStatements } from '../parse/parseTypescript'

export function transformTsTestBlock(testContent: string) {
  const returnExpression = parseReturnExpression(testContent)
  const pruned = removeReturnStatements(testContent)
  const testLocalVars = parseCodeBlockLocalVars(pruned)

  const localVarsString = testLocalVars.length ? `{ ${testLocalVars.join(', ')} }` : '{}'

  const ret = testContent
    ? `
function getTestData() {
  ${pruned}
  ${
    returnExpression
      ? `return ${returnExpression}.map(glass_example => ({ ...${localVarsString}, ...glass_example }))`
      : `return ${localVarsString}`
  }
}
`
    : 'function getTestData() { return {} }'

  return prettier.format(ret, {
    parser: 'typescript',
    printWidth: 120,
    arrowParens: 'avoid',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
  })
}
