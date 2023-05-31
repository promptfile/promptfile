import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'

interface ComposerViewProps {
  run: (inputs: Record<string, string>) => void
  stop: () => void
  streaming: boolean
  inputs: Record<string, string>
  setInputs: (inputs: Record<string, string>) => void
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, setInputs, run, streaming, stop } = props

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
          {Object.keys(inputs).map((key, index) => (
            <VSCodeTextArea
              key={key}
              style={{ width: '100%' }}
              value={inputs[key]}
              id={`composer-input-${index}`}
              placeholder={key}
              onInput={e => {
                const value = (e.target as any).value
                setInputs({ ...inputs, [key]: value })
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  run(inputs)
                }
              }}
            />
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
