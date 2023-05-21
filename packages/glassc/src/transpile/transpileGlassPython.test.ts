import { expect } from 'chai'
import { transpileGlassFilePython } from './transpileGlassPython'

const folders = {
  workspaceFolder: '/Users/me/glassc',
  folderPath: '/Users/me/glassc',
  fileName: 'foo',
  language: 'python',
  outputDirectory: '/Users/me/glassc/src',
}

describe('transpileGlassPython', () => {
  it('should transpile without interpolation variables', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
foo
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""foo""".format()))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile with get-prefixed named', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
foo
</Prompt>`,
      {
        workspaceFolder: '/Users/me/glassc',
        folderPath: '/Users/me/glassc',
        fileName: 'get-foo',
        language: 'python',
        outputDirectory: '/Users/me/glassc/src',
      }
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""foo""".format()))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile with interpolation variables', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
\${foo}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    foo = opt["args"]["foo"]
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{}""".format(foo)))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile including interstitial text', () => {
    const transpiled = transpileGlassFilePython(
      `ignore me
<Prompt>
\${foo}
</Prompt>
and me`,
      folders
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    foo = opt["args"]["foo"]
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{}""".format(foo)))
    }
    return """ignore me
{}
and me""".format(GLASSVAR[0])`)
  })

  it('should transpile with non-interpolation sequences', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
\${foo} and {foo}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    foo = opt["args"]["foo"]
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} and {{foo}}""".format(foo)))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile with multiple interpolation variables', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
\${foo} \${bar}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    foo = opt["args"]["foo"]
    bar = opt["args"]["bar"]
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} {}""".format(foo, bar)))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  it('should transpile with duplicate interpolation variables', () => {
    const transpiled = transpileGlassFilePython(
      `<Prompt>
\${foo} \${bar} \${foo}
\${bar}
</Prompt>`,
      folders
    )

    expect(transpiled.code).to.equal(`def getFooPrompt(opt = { "args": {} }):
    foo = opt["args"]["foo"]
    bar = opt["args"]["bar"]
    GLASSVAR = {
        0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} {} {}
{}""".format(foo, bar, foo, bar)))
    }
    return """{}""".format(GLASSVAR[0])`)
  })

  // it('should transpile with Args block', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/args')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with code block', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/codeBlock')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with complex code block', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/withImport')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with imports and code interpolations', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/complex')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with dynamic for loop', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/moreFor')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with dynamic for loop', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/forLoop')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single <For> loop', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/forLoopAttributesOnly')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single if condition', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/ifCondition')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })

  // it('should transpile with single if condition, string value', () => {
  //   const { input, output } = loadFixture('transpileGlassNext/singleIfCondition')
  //   const transpiled = transpileGlassFilePython(input, folders)
  //   expect(transpiled.code).to.equal(output)
  // })
})
