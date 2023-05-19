import { VSCodeButton, VSCodeDivider, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
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
    <div style={{ width: '100%', height: 'fit-content' }}>
      <VSCodeDivider />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <VSCodeTextField
          style={{ paddingRight: '8px', width: '100%' }}
          value={text}
          id={'composer-input'}
          placeholder="Write a message..."
          onInput={e => {
            const value = (e.target as any).value
            setText(value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              run()
            }
          }}
        />
        <VSCodeButton style={{ width: 'fit-content', flexShrink: 0 }} onClick={() => run()}>
          Send
        </VSCodeButton>
      </div>
    </div>
  )
}
