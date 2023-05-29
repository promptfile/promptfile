import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { LogoView } from './LogoView'

interface TopperViewProps {
  filename: string
  tabs: string[]
  tab: string
  setTab: (tab: string) => void
  reset: () => void
}

export const TopperView = (props: TopperViewProps) => {
  const { filename, tabs, tab, setTab, reset } = props

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
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <LogoView dimension="20" />
          <span style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>
            {filename.replace('.glass', '')}
            <span style={{ fontWeight: 'medium', fontStyle: 'italic', opacity: 0.5 }}>.glass</span>
          </span>
        </div>
        <VSCodeButton appearance="secondary" onClick={reset}>
          Reset
        </VSCodeButton>
      </div>
      <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'row' }}>
        {tabs.map(t => {
          const isCurrentTab = t === tab
          const opacity = isCurrentTab ? 1 : 0.5
          const color = isCurrentTab ? 'white' : undefined
          const borderBottomColor = isCurrentTab ? 'white' : 'transparent'
          return (
            <div style={{ paddingRight: '24px' }} key={t}>
              <div
                style={{
                  opacity,
                  color,
                  borderBottomStyle: 'solid',
                  borderBottomWidth: '2px',
                  borderBottomColor,
                  fontSize: '12px',
                  cursor: 'pointer',
                  paddingBottom: '8px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                }}
                onClick={() => setTab(t)}
              >
                {t}
              </div>
            </div>
          )
        })}
      </div>
      <VSCodeDivider style={{ margin: 0, padding: 0 }} />
    </div>
  )
}
