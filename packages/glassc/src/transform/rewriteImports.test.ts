import { expect } from 'chai'
import { rewriteImports } from './rewriteImports'

describe('rewriteImports', () => {
  it('should leave imports unmodified', () => {
    const document = `<Code>
import foo from 'bar'
import { baz } from './path'
</Code>`

    expect(rewriteImports(document, '/out', '/out/file.glass')).to.equal(document)
  })

  it('should modify imports', () => {
    const document = `<Code>
import foo from 'bar'
import { baz } from './path'
import { bar } from '../foo'
</Code>

<User>
foo
</User>`

    expect(rewriteImports(document, '/out', '/in/file.glass')).to.equal(`<Code>
import foo from 'bar'
import { baz } from '../in/path'
import { bar } from '../foo'
</Code>

<User>
foo
</User>`)
  })
})
