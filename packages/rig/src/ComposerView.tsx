import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface ComposerViewProps {
  run: (inputs: Record<string, string>) => void
  stop: () => void
  streaming: boolean
  variables: string[]
}

export const ComposerView = (props: ComposerViewProps) => {
  const { variables, run, streaming, stop } = props

  const initialInputs: Record<string, string> = Object.fromEntries(variables.map(v => [v, '']))
  const [inputs, setInputs] = useState<Record<string, string>>(initialInputs)

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
        ></div>
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
