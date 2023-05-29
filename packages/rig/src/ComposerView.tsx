import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface ComposerViewProps {
  send: (text: string) => void
}

export const ComposerView = (props: ComposerViewProps) => {
  const { send } = props

  const [text, setText] = useState('')

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
          paddingBottom: '8px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            paddingRight: '8px',
          }}
        >
          <VSCodeTextArea
            style={{ width: '100%' }}
            value={text}
            id={`composer-input`}
            placeholder={'Say something'}
            onInput={e => {
              const value = (e.target as any).value
              setText(value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(text)
                setText('')
              }
            }}
          />
        </div>
        <VSCodeButton style={{ width: 'fit-content' }} onClick={() => send(text)}>
          Send
        </VSCodeButton>
      </div>
    </div>
  )
}
