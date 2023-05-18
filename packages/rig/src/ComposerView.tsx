import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { useState } from 'react'
import { WebviewApi } from 'vscode-webview'
import { RigState } from './rig'

interface KeyViewProps {
  vscode: WebviewApi<RigState>
}
export const KeyView = (props: KeyViewProps) => {
  const { vscode } = props
  const [text, setText] = useState('')

  const run = () => {
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      setText('')
      return
    }
    vscode.postMessage({
      action: 'saveOpenaiKey',
      data: {
        text: trimmedText,
      },
    })
  }

  return (
    <div style={{ width: '100%' }}>
      <VSCodeTextField
        style={{ width: '100%', paddingBottom: '8px' }}
        value={text}
        placeholder="sk-..."
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
      <VSCodeButton style={{ width: '100%' }} onClick={() => run()}>
        Send
      </VSCodeButton>
    </div>
  )
}
