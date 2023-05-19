import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
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
    <div style={{ width: '100%', flexShrink: 0 }}>
      <VSCodeDivider style={{ margin: 0, padding: 0 }} />
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
        <VSCodeTextArea
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
              e.preventDefault()
              run()
            }
          }}
        />
        <VSCodeButton style={{ width: 'fit-content' }} onClick={() => run()}>
          Send
        </VSCodeButton>
      </div>
    </div>
  )
}
