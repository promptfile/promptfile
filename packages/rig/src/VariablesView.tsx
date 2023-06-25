import { VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'

interface VariablesViewProps {
  inputs: Record<string, string>
  setValue: (key: string, value: string) => void
}

export const VariablesView = (props: VariablesViewProps) => {
  const { inputs, setValue } = props

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {Object.keys(inputs).map(key => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '12px', color: 'white', paddingLeft: '8px' }}>{key}</div>
          <VSCodeTextArea value={inputs[key]} onChange={(e: any) => setValue(key, e.target.value)} />
        </div>
      ))}
    </div>
  )
}
