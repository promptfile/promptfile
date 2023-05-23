import { expect } from 'chai'
import {
  codeBlockContainsAwait,
  parseCodeBlock,
  parseCodeBlockLocalVars,
  parseCodeBlockUndeclaredSymbols,
  parseCodeImportedSymbols,
  parseReturnExpression,
  removeReturnStatements,
} from './parseTypescript'

describe('parseTypescript', () => {
  it('should parse local variables', () => {
    const code = `
const res = await fetch('https://google.com')
let data = await res.text()
`
    expect(parseCodeBlockLocalVars(code)).to.deep.equal(['res', 'data'])
  })

  it('should parse local variables with useState', () => {
    const code = `
const [res, setRes] = useState()
`
    expect(parseCodeBlockLocalVars(code)).to.deep.equal(['res', 'setRes'])
  })

  it('should parse undeclared variables with useState', () => {
    const code = `
const [res, setRes] = useState()
`
    expect(parseCodeBlockUndeclaredSymbols(code)).to.deep.equal(['useState'])
  })

  it('should parse local variables with descructuring', () => {
    const code = `
const a = { b: 1, c: 2 }
const {b, c} = a
`
    expect(parseCodeBlockLocalVars(code)).to.deep.equal(['a', 'b', 'c'])
  })

  it('should parse undeclared values', () => {
    const code = `
const res = await fetch(url)
const data = await res.json()
`
    expect(parseCodeBlockUndeclaredSymbols(code)).to.deep.equal(['fetch', 'url'])
  })

  it('should parse imported values', () => {
    const code = `
import {foo, bar} from './someFile'
import * as something from './someOtherFile'
import baz from 'baz'
`
    expect(parseCodeImportedSymbols(code)).to.deep.equal(['foo', 'bar', 'something', 'baz'])
  })

  it('should parse code block await', () => {
    const code = `
const res = await fetch(url)
`
    expect(codeBlockContainsAwait(code)).to.equal(true)
  })

  it('should ignore code block await inside string', () => {
    const code = `
const res = "not a real await"
`

    expect(codeBlockContainsAwait(code)).to.equal(false)
  })

  it('should parse block', () => {
    const code = `
import {foo, bar} from './someFile'
import * as something from './someOtherFile'
import baz from 'baz'

const res = await fetch(url, { method, other: something.other })
const data = await res.json()
`
    expect(parseCodeBlock(code)).to.deep.equal({
      isAsync: true,
      importedSymbols: ['foo', 'bar', 'something', 'baz'],
      symbolsAddedToScope: ['res', 'data'],
      undeclaredValuesNeededInScope: ['url', 'method'],
    })
  })

  it('should parse block with state', () => {
    const code = `
const initProfile = { firstName: '', lastName: '', hasChatted: false }
const [profile, setProfile] = useState(initProfile)
const [moreState, setMoreState] = useState('')
`
    expect(parseCodeBlock(code)).to.deep.equal({
      isAsync: false,
      importedSymbols: [],
      symbolsAddedToScope: ['initProfile', 'profile', 'setProfile', 'moreState', 'setMoreState'],
      undeclaredValuesNeededInScope: ['useState'],
    })
  })

  it('should parse block with missing imports', () => {
    const code = `
const conversation = await db.converation.findUniqueOrThrow({where: {id: conversationId}})
const messages = await db.message.findMany({where: {conversationId: conversation.id}})
`
    expect(parseCodeBlock(code)).to.deep.equal({
      isAsync: true,
      importedSymbols: [],
      symbolsAddedToScope: ['conversation', 'messages'],
      undeclaredValuesNeededInScope: ['db', 'conversationId'],
    })
  })

  it('should parse block with set state', () => {
    const code = `
const initProfile = { firstName: '', lastName: '', hasChatted: false }
const [profile, setProfile] = useState(initProfile)
const [moreState, setMoreState] = useState('')

setMoreState('foo')
`
    expect(parseCodeBlock(code)).to.deep.equal({
      isAsync: false,
      importedSymbols: [],
      symbolsAddedToScope: ['initProfile', 'profile', 'setProfile', 'moreState', 'setMoreState'],
      undeclaredValuesNeededInScope: ['useState'],
    })
  })

  describe('parseReturnExpression', () => {
    it('should parse return expression', () => {
      const code = `
const url = "https://elliottburris.com"
const question = "where did elliott go to school"
return [{ foo: "bar"}]
`

      const returnExpression = parseReturnExpression(code)
      expect(returnExpression).to.equal('[{ foo: "bar"}]')
    })

    it('should parse empty expression', () => {
      const code = `
const url = "https://elliottburris.com"
const question = "where did elliott go to school"
`

      const returnExpression = parseReturnExpression(code)
      expect(returnExpression).to.equal('')
    })

    it('should parse empty expression', () => {
      const code = ``

      const returnExpression = parseReturnExpression(code)
      expect(returnExpression).to.equal('')
    })
  })

  describe('removeReturnStatements', () => {
    it('should remove return statements', () => {
      const code = `const url = "https://elliottburris.com"
const question = "where did elliott go to school"
return [{ foo: "bar"}]`

      const transform = removeReturnStatements(code)
      expect(transform).to.equal(`const url = "https://elliottburris.com";
const question = "where did elliott go to school";
;
`)
    })

    it('should not transform expression without return statements', () => {
      const code = `const url = "https://elliottburris.com";
const question = "where did elliott go to school";
`

      const transform = removeReturnStatements(code)
      expect(transform).to.equal(code)
    })
  })
})
