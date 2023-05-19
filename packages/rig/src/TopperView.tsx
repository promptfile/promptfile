import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { LogoView } from './LogoView'

interface TopperViewProps {
  filename: string
  reset: () => void
}

export const TopperView = (props: TopperViewProps) => {
  const { filename, reset } = props

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <LogoView dimension="24" />
          <span style={{ fontSize: '17px', fontWeight: 'bold', paddingLeft: '12px' }}>
            {filename.split('.glass')[0]}
            <span style={{ opacity: 0.3, color: 'white', fontStyle: 'italic' }}>.glass</span>
          </span>
        </div>
        <VSCodeButton appearance="secondary" onClick={reset}>
          Reset
        </VSCodeButton>
      </div>
      <VSCodeDivider />
    </div>
  )
}
