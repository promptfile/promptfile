import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface ComposerViewProps {
  send: (text: string) => void
}
export const ComposerView = (props: ComposerViewProps) => {
  const { send } = props
  const [text, setText] = useState('')

  const trimmedText = text.trim()
  const run = () => {
    if (trimmedText.length === 0) {
      setText('')
      return
    }
    send(trimmedText)
    setText('')
  }

  useEffect(() => {
    setTimeout(() => {
      document.getElementById('composer-input')?.focus()
    }, 500)
  }, [])

  return (
    <div style={{ width: '100%', height: 'full', display: 'flex', paddingBottom: '16px' }}>
      <VSCodeTextField
        style={{ width: '100%', paddingRight: '8px' }}
        value={text}
        id={'composer-input'}
        placeholder="Write a message..."
        onInput={e => {
          const value = (e.target as any).value
          setText(value)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
            run()
          }
        }}
      />
      <VSCodeButton style={{ width: 'fit-content' }} onClick={() => run()}>
        Send
      </VSCodeButton>
    </div>
  )
}
