import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { LogoView } from './LogoView'

interface TopperViewProps {
  reset: () => void
  filename: string
}

export const TopperView = (props: TopperViewProps) => {
  const { reset, filename } = props

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
            {filename}
            <span style={{ fontWeight: 'normal', opacity: 0.5 }}>.glass</span>
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
