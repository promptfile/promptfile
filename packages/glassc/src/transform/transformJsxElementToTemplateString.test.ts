import { expect } from 'chai'
import { transformJsxElementToTemplateString } from './transformJsxElementToTemplateString'

describe('transformJsxElementToTemplateString', () => {
  it('should transform simple element', () => {
    expect(
      transformJsxElementToTemplateString(`<Block hello={m.world} foo="bar">
block content \${whoa}
</Block>`)
    ).to.equal(`<Block hello={\${JSON.stringify(m.world)}} foo="bar">
block content \${whoa}
</Block>`)
  })

  it('should transform complex element with nested elements', () => {
    expect(
      transformJsxElementToTemplateString(`<Block hello={m.world} foo="bar">
block content \${whoa}

<Text if={m.isAdmin}>
whoa text
</Text>
</Block>`)
    ).to.equal(`<Block hello={\${JSON.stringify(m.world)}} foo="bar">
block content \${whoa}

<Text if={\${JSON.stringify(m.isAdmin)}}>
whoa text
</Text>
</Block>`)
  })
})
