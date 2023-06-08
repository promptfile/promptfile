import MonacoEditor from '@monaco-editor/react'
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { useEffect } from 'react'

interface ComposerViewProps {
  run: (inputs: Record<string, string>) => void
  stop: () => void
  reload: () => void
  streaming: boolean
  inputs: Record<string, string>
  setInputs: (inputs: Record<string, string>) => void
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, setInputs, streaming, stop } = props

  const keys: string[] = Object.keys(inputs)

  useEffect(() => {
    document.getElementById('composer-input-0')?.focus()
  }, [keys.length])

  const setValue = (key: string, value: string) => {
    setInputs({ ...inputs, [key]: value })
  }

  const run = () => {
    props.run(inputs)
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
                  defaultValue={''}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    wordWrap: 'on',
                    fontSize: 12,
                    lineDecorationsWidth: 0,
                  }}
                  onMount={editor => {
                    editor.focus()
                    editor.onKeyDown(e => {
                      const value = editor.getValue()
                      setValue(key, value)
                      if (e.browserEvent.key === 'Enter' && (e.browserEvent.metaKey || e.browserEvent.ctrlKey)) {
                        e.preventDefault()
                        run()
                      }
                    })
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
        <VSCodeButton style={{ width: '100%' }} appearance="primary" onClick={() => run()}>
          Run
        </VSCodeButton>
      )}
    </div>
  )
}
