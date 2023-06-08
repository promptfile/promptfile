import MonacoEditor from '@monaco-editor/react'
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'

import { useEffect } from 'react'

interface ComposerViewProps {
  run: () => void
  stop: () => void
  reload: () => void
  streaming: boolean
  inputs: Record<string, string>
  setInputs: (inputs: Record<string, string>) => void
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, setInputs, streaming, run, stop } = props

  const keys: string[] = Object.keys(inputs)

  useEffect(() => {
    document.getElementById('composer-input-0')?.focus()
  }, [keys.length])

  const setValue = (key: string, value: string) => {
    setInputs({ ...inputs, [key]: value })
  }

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      <VSCodeDivider style={{ margin: 0, padding: 0 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {keys.length > 0 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingRight: '8px',
            }}
          >
            {keys.map((key, index) => (
              <div key={key} style={{ width: '100%' }}>
                {keys.length > 1 && (
                  <div style={{ paddingTop: index === 0 ? '0px' : '8px', paddingBottom: '4px' }}>{key}</div>
                )}
                <MonacoEditor
                  width="100%"
                  height="200px"
                  theme="vs-dark"
                  language={'markdown'}
                  value={inputs[key]}
                  onChange={value => setValue(key, value ?? '')}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    wordWrap: 'on',
                    fontSize: 12,
                    lineDecorationsWidth: 0,
                  }}
                  onMount={(editor, monaco) => {
                    editor.focus()
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, run)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {streaming ? (
        <VSCodeButton style={{ width: '100%' }} appearance="secondary" onClick={stop}>
          Stop
        </VSCodeButton>
      ) : (
        <VSCodeButton
          style={{ width: '100%' }}
          appearance="primary"
          onClick={() => run()}
          disabled={!Object.values(inputs).some(v => v.trim().length > 0)}
        >
          Run
        </VSCodeButton>
      )}
    </div>
  )
}
