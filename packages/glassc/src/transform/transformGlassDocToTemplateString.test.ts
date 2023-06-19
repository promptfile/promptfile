import { expect } from 'chai'
import {
  transformGlassDocumentToTemplateString,
  transformGlassDocumentToTemplateStringPython,
} from './transformGlassDocToTemplateString'

describe('transformGlassDocumentToTemplateString', () => {
  it('should transform Glass for TypeScript/JavaScript', () => {
    const doc = `<Block hello={m.world} foo="bar">
block content @{whoa}

<Text if={foo.isAdmin}>
whoa text
</Text>
</Block>`

    expect(transformGlassDocumentToTemplateString(doc)).to.equal(`<Block hello={\${JSON.stringify(m.world)}} foo="bar">
block content \${whoa}

<Text if={\${JSON.stringify(foo.isAdmin)}}>
whoa text
</Text>
</Block>`)
  })

  it('should transform Glass for Python simple', () => {
    const doc = `hello this is text \${1}`

    expect(transformGlassDocumentToTemplateStringPython(doc)).to.deep.equal({
      newDocument: `"""hello this is text {}""".format(1)`,
      undeclaredSymbols: [],
    })
  })

  it('should transform Glass for Python medium', () => {
    const doc = `hello this is text \${1}

<Block hello={2} foo="bar">
content
</Block>`

    expect(transformGlassDocumentToTemplateStringPython(doc)).to.deep.equal({
      newDocument: `"""hello this is text {}

{}""".format(1, """<Block hello={{"{}"}} foo="bar">
{}
</Block>""".format(2, """content""".format()))`,
      undeclaredSymbols: [],
    })
  })

  it('should transform Glass for Python', () => {
    const doc = `hello this is text \${a}

<Block hello={2} foo="bar">
block content \${3}

<Text if={4}>
whoa text
</Text>
</Block>`

    expect(transformGlassDocumentToTemplateStringPython(doc)).to.deep.equal({
      newDocument: `"""hello this is text {}

{}""".format(a, """<Block hello={{"{}"}} foo="bar">
{}
</Block>""".format(2, """block content {}

{}""".format(3, """<Text if={{"{}"}}>
{}
</Text>""".format(4, """whoa text""".format()))))`,
      undeclaredSymbols: ['a'],
    })
  })
})
