import { exec } from 'child_process'

function callPythonScript(code: string, testContent: string): Promise<string> {
  const base64Code = Buffer.from(code).toString('base64')
  const base64TestContent = Buffer.from(testContent).toString('base64')

  return new Promise((resolve, reject) => {
    exec(`echo "${base64Code}" | base64 --decode | python3 - '${base64TestContent}'`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      if (stderr) {
        reject(new Error(stderr))
        return
      }
      resolve(stdout.trim())
    })
  })
}

export async function transformPythonTestBlock(testContent: string) {
  if (testContent.trim() === '') {
    return 'def get_test_data(): return {}'
  }

  const code = `import ast
import base64
import sys
import textwrap
from typing import List, Optional


def parsePythonLocalVariables(code: str) -> List[str]:
    """
    Parse a Python code block and return the names of local variables
    """
    module = ast.parse(code)
    local_vars = []

    for node in ast.walk(module):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    local_vars.append(target.id)

    return local_vars


def parseReturnExpression(code: str) -> Optional[str]:
    """
    Parse a Python code block and return the first return expression found
    """
    module = ast.parse(code)
    for node in ast.walk(module):
        if isinstance(node, ast.Return):
            return ast.unparse(node.value).strip()
    return None


def removeReturnStatements(code: str) -> str:
    """
    Parse a Python code block and remove all return statements
    """
    module = ast.parse(code)
    new_body = [node for node in module.body if not isinstance(node, ast.Return)]
    module.body = new_body
    return ast.unparse(module)


def transformPyTestBlock(testContent: str) -> str:
    returnExpression = parseReturnExpression(testContent)
    pruned = removeReturnStatements(testContent)
    testLocalVars = parsePythonLocalVariables(pruned)

    localVarsDict = ', '.join(f"'{var}': {var}" for var in testLocalVars)

    if testContent:
        if returnExpression:
            ret = f"""
def get_test_data():
{textwrap.indent(pruned, '    ')}
    _temp = {returnExpression}
    return [_item.update({{{localVarsDict}}}) or _item for _item in _temp]
"""
        else:
            ret = f"""
def get_test_data():
{textwrap.indent(pruned, '    ')}
    return {{{localVarsDict}}}
"""
    else:
        ret = "def get_test_data(): return {}"

    return ret

decoded_test_content = base64.b64decode(sys.argv[1]).decode('utf-8')
result = transformPyTestBlock(decoded_test_content)
print(result)`

  return await callPythonScript(code, testContent)
}
