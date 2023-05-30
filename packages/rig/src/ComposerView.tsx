import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface ComposerViewProps {
  send: (text: string) => void
  stop: () => void
  streaming: boolean
}

export const ComposerView = (props: ComposerViewProps) => {
  const { send, streaming, stop } = props

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
        {streaming ? (
          <VSCodeButton style={{ width: 'fit-content' }} appearance="secondary" onClick={stop}>
            Stop
          </VSCodeButton>
        ) : (
          <VSCodeButton style={{ width: 'fit-content' }} appearance="primary" onClick={() => send(text)}>
            Send
          </VSCodeButton>
        )}
      </div>
    </div>
  )
}
