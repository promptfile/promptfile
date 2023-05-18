import { expect } from 'chai'
import { transformGlassDocumentToTemplateString } from './transformGlassDocToTemplateString'

describe('transformMdxDocumentToTemplateString', () => {
  it('should transform MDX document', () => {
    const doc = `hello this is text \${fooby}

<Block hello={m.world} foo="bar">
block content \${whoa}

<Text if={foo.isAdmin}>
whoa text
</Text>
</Block>`

    expect(transformGlassDocumentToTemplateString(doc)).to.equal(`hello this is text \${fooby}

<Block hello={\${JSON.stringify(m.world)}} foo="bar">
block content \${whoa}

<Text if={\${JSON.stringify(foo.isAdmin)}}>
whoa text
</Text>
</Block>`)
  })
})
