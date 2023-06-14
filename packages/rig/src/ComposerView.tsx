import MonacoEditor from '@monaco-editor/react'
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'

import { useEffect, useRef } from 'react'

interface ComposerViewProps {
  theme: string
  run: (inputsToRun: Record<string, string>, sessionToRun: string) => void
  stop: () => void
  reload: () => void
  streaming: boolean
  inputs: Record<string, string>
  setValue: (key: string, value: string) => void
  session: string
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, setValue, streaming, run, stop, theme, session } = props

  const inputsRef = useRef(inputs)
  const sessionRef = useRef(session)

  const keys: string[] = Object.keys(inputs)

  useEffect(() => {
    document.getElementById('composer-input-0')?.focus()
  }, [keys.length])

  useEffect(() => {
    inputsRef.current = inputs
    sessionRef.current = session
  }, [inputs, session])

  function mapVSCodeThemeToMonaco(theme: string) {
    const themeMapping: Record<string, string> = {
      'Default Dark Modern': 'vs-dark',
      'Default Light Modern': 'vs',
      'Default Dark+': 'vs-dark',
      'Default Light+': 'vs',
      Monokai: 'monokai',
      'Solarized Dark': 'solarized-dark',
      'Solarized Light': 'solarized-light',
    }
    if (themeMapping[theme]) {
      return themeMapping[theme]
    }
    return 'vs-dark'
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
                  height={`100px`}
                  theme={mapVSCodeThemeToMonaco(theme)}
                  language={'markdown'}
                  value={inputs[key]}
                  onChange={value => setValue(key, value ?? '')}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    padding: {
                      top: 4,
                    },
                    wordWrap: 'on',
                    fontSize: 12,
                    lineDecorationsWidth: 0,
                  }}
                  onMount={(editor, monaco) => {
                    editor.focus()
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                      run(inputsRef.current, sessionRef.current)
                    })
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {streaming ? (
        <VSCodeButton style={{ width: '100%' }} appearance="secondary" onClick={stop} disabled={false}>
          Stop
        </VSCodeButton>
      ) : (
        <VSCodeButton
          style={{ width: '100%' }}
          appearance="secondary"
          onClick={() => run(inputsRef.current, sessionRef.current)}
          disabled={!Object.values(inputs).some(v => v.trim().length > 0)}
        >
          Run
        </VSCodeButton>
      )}
    </div>
  )
}
