import { expect } from 'chai'
import { rewriteImports } from './rewriteImports'

describe('rewriteImports', () => {
  it('should leave imports unmodified', () => {
    const document = `<Init>
import foo from 'bar'
import { baz } from './path'
</Init>`

    expect(rewriteImports(document, '/out', '/out/file.glass')).to.equal(document)
  })

  it('should modify imports', () => {
    const document = `<Init>
import foo from 'bar'
import { baz } from './path'
import { bar } from '../foo'
</Init>

<User>
foo
</User>`

    expect(rewriteImports(document, '/out', '/in/file.glass')).to.equal(`<Init>
import foo from 'bar'
import { baz } from '../in/path'
import { bar } from '../foo'
</Init>

<User>
foo
</User>`)
  })
})
