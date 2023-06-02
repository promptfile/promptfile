import glasslib from '@glass-lang/glasslib'
import path from 'path'

function rewriteImportPaths(codeSection: string, outPath: string, filePath: string) {
  const lines = codeSection.split('\n')
  return lines
    .map(l => {
      // find the import groups, importLine will match `import (.+) from '(.+)'`
      const match = /import (.+) from ['"](.+)['"]/gms.exec(l)
      if (!match) {
        return l
      }
      const [, importName, importPath] = match

      // importPath is the path to the file being imported

      let resolvedPath = importPath

      if (!importPath.startsWith('.')) {
        return l
      }

      // importPath is relative to currentFilePath; we need to make it relative to the output directory (outDir)
      let relativeImportPath = path.relative(outPath, path.join(filePath, '..', importPath))

      if (!relativeImportPath.startsWith('.')) {
        relativeImportPath = `./${relativeImportPath}`
      }

      resolvedPath = relativeImportPath

      // imports.push(node.value)
      return `import ${importName} from '${resolvedPath}'`
    })
    .join('\n')
}

export function rewriteImports(glassDocument: string, outPath: string, filePath: string) {
  return glasslib
    .parseGlassDocument(glassDocument)
    .map(node => (node.type === 'code' ? rewriteImportPaths(node.content, outPath, filePath) : node.content))
    .join('')
}
