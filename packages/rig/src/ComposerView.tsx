import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface ComposerViewProps {
  run: (inputs: Record<string, string>) => void
  stop: () => void
  streaming: boolean
}

export const ComposerView = (props: ComposerViewProps) => {
  const { run, streaming, stop } = props

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
          paddingLeft: '16px',
          paddingRight: '16px',
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
                run({ input: text })
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
          <VSCodeButton style={{ width: 'fit-content' }} appearance="primary" onClick={() => run({ input: text })}>
            Run
          </VSCodeButton>
        )}
      </div>
    </div>
  )
}
