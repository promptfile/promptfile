import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect } from 'react'

interface ComposerViewProps {
  run: (inputs: Record<string, string>) => void
  stop: () => void
  streaming: boolean
  inputs: Record<string, string>
  setInputs: (inputs: Record<string, string>) => void
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, setInputs, run, streaming, stop } = props

  const keys: string[] = Object.keys(inputs)

  useEffect(() => {
    document.getElementById('composer-input-0')?.focus()
  }, keys)

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
          {keys.map((key, index) => (
            <div key={key} style={{ width: '100%' }}>
              {keys.length > 1 && (
                <div style={{ paddingTop: index === 0 ? '0px' : '8px', paddingBottom: '4px' }}>{key}</div>
              )}
              <VSCodeTextArea
                style={{ width: '100%' }}
                value={inputs[key]}
                id={`composer-input-${index}`}
                placeholder={keys.length === 1 ? key : ''}
                onInput={e => {
                  const value = (e.target as any).value
                  setInputs({ ...inputs, [key]: value })
                }}
                onKeyDown={e => {
                  if (!streaming && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    run(inputs)
                  }
                }}
              />
            </div>
          ))}
        </div>
        {streaming ? (
          <VSCodeButton appearance="secondary" onClick={stop}>
            Stop
          </VSCodeButton>
        ) : (
          <VSCodeButton appearance="primary" onClick={() => run(inputs)}>
            Run
          </VSCodeButton>
        )}
      </div>
    </div>
  )
}
