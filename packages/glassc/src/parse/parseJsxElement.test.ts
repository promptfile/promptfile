import { expect } from 'chai'
import { parseJsxElement } from './parseJsxElement'

describe('parseJsxElement', () => {
  it('should parse JSX without variables', () => {
    const code = `<Assistant> some text with no variables</Assistant>`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['Assistant'],
      undeclaredVariables: [],
    })
  })

  it('should parse JSX without variables', () => {
    const code = `<Assistant> some text with \${variable}</Assistant>`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['Assistant'],
      undeclaredVariables: ['variable'],
    })
  })

  it('should parse JSX', () => {
    const code = `<For each={messages} />`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['For'],
      undeclaredVariables: ['messages'],
    })
  })

  it('should parse JSX', () => {
    const code = `<System>
You are a helpful assistant.
</System>

<User if={false}>
Who was gandhi?
</User>

<User if={message}>
Who was Curie?
</User>

<User if="false">
Who was gandhi?
</User>`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['System', 'User'],
      undeclaredVariables: ['message'],
    })
  })

  it('should parse nested JSX', () => {
    const code = `<For each={messages} fragment={m => <Block foo="bar" role={role} content={m.text} />}></For>`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['For', 'Block'],
      undeclaredVariables: ['messages', 'role'],
    })
  })

  it('should parse nested JSX with complicated innards', () => {
    const code = `<For each={messages} fragment={m => <Block foo="bar" role={() => {
      const a = b
      return a
    }} content={m.text} />}></For>`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['For', 'Block'],
      undeclaredVariables: ['messages', 'b'],
    })
  })

  it('should parse single For statement', () => {
    const code = `<For each={[{role: 'user', content: 'who was gandhi?'}]} fragment={item => <Block role={item.role} content={item.content} />}  />`
    expect(parseJsxElement(code)).to.deep.equal({
      tagNames: ['For', 'Block'],
      undeclaredVariables: [],
    })
  })
})
