import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'

interface ComposerViewProps {
  values: Record<string, string>
  setValue: (variable: string, value: string) => void
  send: () => void
}
export const ComposerView = (props: ComposerViewProps) => {
  const { send, values, setValue } = props

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
          {Object.keys(values).map((variable, index) => (
            <VSCodeTextArea
              key={variable}
              style={{ width: '100%' }}
              value={values[variable] ?? ''}
              id={`composer-input-${index}`}
              placeholder={variable}
              onInput={e => {
                const value = (e.target as any).value
                setValue(variable, value)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
          ))}
        </div>
        <VSCodeButton style={{ width: 'fit-content' }} onClick={() => send()}>
          Send
        </VSCodeButton>
      </div>
    </div>
  )
}
