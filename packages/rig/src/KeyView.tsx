import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { useState } from 'react'
import { WebviewApi } from 'vscode-webview'
import { RigState } from './rig'

interface KeyViewProps {
  vscode: WebviewApi<RigState>
}
export const KeyView = (props: KeyViewProps) => {
  const { vscode } = props
  const [inputKey, setInputKey] = useState('')

  const saveKey = () => {
    const trimmedKey = inputKey.trim()
    if (!trimmedKey.startsWith('sk-')) {
      vscode.postMessage({
        action: 'showMessage',
        data: {
          level: 'error',
          text: '',
        },
      })
      return
    }
    vscode.postMessage({
      action: 'saveOpenaiKey',
      data: {
        key: trimmedKey,
      },
    })
  }
  return (
    <div style={{ paddingTop: '16px' }}>
      <div style={{ paddingBottom: '16px' }}>
        The Glass playground requires an OpenAI API key to function. Please enter one below.
      </div>
      <VSCodeTextField
        style={{ width: '100%', paddingBottom: '8px' }}
        value={inputKey}
        placeholder="sk-..."
        onInput={e => {
          const value = (e.target as any).value
          setInputKey(value)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
            saveKey()
          }
        }}
      />

      <VSCodeButton style={{ width: '100%' }} onClick={() => saveKey()}>
        Save API key
      </VSCodeButton>
      <div style={{ opacity: 0.5, paddingTop: '32px' }}>
        Note: Glass does not store or access this key remotely — it exists only in your VSCode settings as{' '}
        <span style={{ fontFamily: 'monospace' }}>glass.openaiKey</span>.
      </div>
    </div>
  )
}
