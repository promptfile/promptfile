import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'
import { WebviewApi } from 'vscode-webview'
import { RigState } from './rig'

interface ComposerViewProps {
  vscode: WebviewApi<RigState>
}
export const ComposerView = (props: ComposerViewProps) => {
  const { vscode } = props
  const [text, setText] = useState('')

  const run = () => {
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      setText('')
      return
    }
    vscode.postMessage({
      action: 'run',
      data: {
        text: trimmedText,
      },
    })
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
