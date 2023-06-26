import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'

interface VariablesViewProps {
  variables: string[]
  interpolateVariables: (inputsToRun: Record<string, string>) => void
}

export const VariablesView = (props: VariablesViewProps) => {
  const { variables, interpolateVariables } = props

  const [inputs, setInputs] = useState<Record<string, string>>(Object.fromEntries(variables.map(v => [v, ''])))

  const setValue = (key: string, value: string) => {
    setInputs({ ...inputs, [key]: value })
  }

  useEffect(() => {
    const newInputs: Record<string, string> = {}
    variables.forEach(v => {
      newInputs[v] = inputs[v] || ''
    })
    setInputs(() => newInputs)
  }, [variables])

  return (
    <div
      style={{
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {Object.keys(inputs).map(key => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', paddingTop: '24px' }}>
          <div style={{ paddingBottom: '4px' }}>{key}</div>
          <VSCodeTextArea value={inputs[key]} onChange={(e: any) => setValue(key, e.target.value)} />
        </div>
      ))}
      <div style={{ paddingTop: '24px' }}>
        <VSCodeButton onClick={() => interpolateVariables(inputs)} style={{ width: '100%' }}>
          Save
        </VSCodeButton>
      </div>
    </div>
  )
}
