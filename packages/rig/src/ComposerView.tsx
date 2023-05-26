import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface ComposerViewProps {
  variables: string[]
  send: (values: Record<string, string>) => void
}

export const ComposerView = (props: ComposerViewProps) => {
  const { variables, send } = props

  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const newValues = Object.fromEntries((variables as string[]).map(variable => [variable, values.variable ?? '']))
    setValues(() => newValues)
  }, [variables])

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      <VSCodeDivider style={{ margin: 0, padding: 0 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '24px',
          paddingRight: '24px',
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
          {Object.keys(values).map((variable, index) => (
            <div key={variable} style={{ flexDirection: 'column', display: 'flex' }}>
              <span style={{ paddingBottom: '4px' }}>{variable}</span>
              <VSCodeTextArea
                style={{ width: '100%' }}
                value={values[variable] ?? ''}
                id={`composer-input-${index}`}
                placeholder={''}
                onInput={e => {
                  const value = (e.target as any).value
                  setValues({ ...values, [variable]: value })
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(values)
                  }
                }}
              />
            </div>
          ))}
        </div>
        <VSCodeButton style={{ width: 'fit-content' }} onClick={() => send(values)}>
          Run
        </VSCodeButton>
      </div>
    </div>
  )
}
