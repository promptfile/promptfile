import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useState } from 'react'

interface ChatViewProps {
  filename: string
  postMessage: (action: string, data: any) => void
}

export const ChatView = (props: ChatViewProps) => {
  const { postMessage } = props

  const [text, setText] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [loading, setLoading] = useState(false)

  const execute = () => {
    const trimmed = text.trim()
    if (openaiKey.length === 0) {
      postMessage('showMessage', { level: 'error', text: 'Please set `glass.openaiKey` in your extension settings.' })
      return
    }
    if (trimmed.length === 0) {
      postMessage('showMessage', { level: 'error', text: '' })
      return
    }
    setLoading(true)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ height: '100%', width: '100%', backgroundColor: 'green' }} />
      <div style={{ width: '100%', alignItems: 'center' }}>
        <VSCodeTextArea
          value={text}
          onInput={e => {
            const value = (e.target as any).value
            setText(value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
              execute()
            }
          }}
        />
        <VSCodeButton id="run-button" onClick={() => execute()}>
          Send
        </VSCodeButton>
      </div>
    </div>
  )
}
