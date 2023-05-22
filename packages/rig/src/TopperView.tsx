import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { LogoView } from './LogoView'

interface TopperViewProps {
  filename: string
  reset: () => void
}

export const TopperView = (props: TopperViewProps) => {
  const { filename, reset } = props

  return (
    <div
      style={{
        width: '100%',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          paddingTop: '16px',
          paddingBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <LogoView dimension="20" />
          <span style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>
            {filename.split('.glass')[0] ?? 'loading'}
            <span style={{ opacity: 0.3, color: 'white', fontStyle: 'italic' }}>.glass</span>
          </span>
        </div>
        <VSCodeButton appearance="secondary" onClick={reset}>
          Reset
        </VSCodeButton>
      </div>
      <VSCodeDivider style={{ margin: 0, padding: 0 }} />
    </div>
  )
}
