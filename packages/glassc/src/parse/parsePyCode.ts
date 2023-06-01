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

export async function parsePyCode(testContent: string) {
  const code = `import json
import ast
import base64
import sys
import builtins

class CodeAnalyzer(ast.NodeVisitor):
    def __init__(self, source_code):
        self.source_code = source_code
        self.symbols_added_to_scope = set()
        self.undeclared_symbols = set()
        self.scopes = [set()]

    def analyze(self):
        self.generic_visit(ast.parse(self.source_code))
        self.undeclared_symbols -= self.symbols_added_to_scope
        self.undeclared_symbols -= set(dir(builtins))

    def visit_Assign(self, node):
        for target in node.targets:
            self.visit(target)
        self.visit(node.value)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Store):
            if len(self.scopes) == 1:
                self.symbols_added_to_scope.add(node.id)
            self.scopes[-1].add(node.id)
        elif isinstance(node.ctx, ast.Load):
            if not any(node.id in scope for scope in self.scopes):
                self.undeclared_symbols.add(node.id)

    def visit_FunctionDef(self, node):
        if len(self.scopes) == 1:
            self.symbols_added_to_scope.add(node.name)
        self.scopes.append(set())
        for arg in node.args.args:
            self.scopes[-1].add(arg.arg)
        self.generic_visit(node)
        self.scopes.pop()

    def visit_Lambda(self, node):
        self.scopes.append(set())
        for arg in node.args.args:
            self.scopes[-1].add(arg.arg)
        self.generic_visit(node)
        self.scopes.pop()

    def visit_Import(self, node):
        for alias in node.names:
            self.symbols_added_to_scope.add(alias.asname if alias.asname else alias.name)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            if alias.name == '*':
                raise NotImplementedError("Wildcards in imports are not supported")
            self.symbols_added_to_scope.add(alias.asname if alias.asname else alias.name)

def analyze_code_block(code):
    analyzer = CodeAnalyzer(code)
    analyzer.analyze()
    return {
        "symbolsAddedToScope": list(analyzer.symbols_added_to_scope),
        "undeclaredValuesNeededInScope": list(analyzer.undeclared_symbols),
    }


decoded_test_content = base64.b64decode(sys.argv[1]).decode('utf-8')
result = json.dumps(analyze_code_block(decoded_test_content))
print(result)`

  const res = await callPythonScript(code, testContent)
  return JSON.parse(res) as { symbolsAddedToScope: string[]; undeclaredValuesNeededInScope: string[] }
}
