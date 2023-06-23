import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { LogoView } from './LogoView'

interface TopperViewProps {
  filename: string
  tabs: string[]
  tab: string
  setTab: (tab: string) => void
  reload: () => void
  dirty: boolean
  reloadable: boolean
  openCurrentSessionFile: () => void
  shareCurrentSessionGist: () => void
}

export const TopperView = (props: TopperViewProps) => {
  const {
    dirty,
    reloadable,
    filename,
    tabs,
    tab,
    setTab,
    reload,
    openOutput,
    openCurrentSessionFile,
    shareCurrentSessionGist,
  } = props

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
          <span style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px', paddingRight: '8px' }}>
            {filename.replace('.prompt', '')}
            <span style={{ fontWeight: 'medium', fontStyle: 'italic', opacity: 0.5 }}>.prompt</span>
          </span>
          {dirty && (
            <svg height="8" width="8">
              <circle cx="4" cy="4" r="4" fill={'#FFB454'} />
            </svg>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div
            onMouseEnter={(event: any) => {
              event.target.style.opacity = '1.0'
            }}
            onMouseLeave={(event: any) => {
              event.target.style.opacity = '0.5'
            }}
            onClick={shareCurrentSessionGist}
            style={{ fontSize: '12px', paddingRight: '16px', opacity: 0.5, cursor: 'pointer' }}
          >
            Share
          </div>
          <VSCodeButton appearance="secondary" onClick={reload} disabled={!reloadable}>
            New session
          </VSCodeButton>
          {/* <div style={{ paddingLeft: '8px' }}>
            <VSCodeButton onClick={transpile}>Deploy</VSCodeButton>
          </div> */}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
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
                  onMouseEnter={(event: any) => {
                    event.target.style.opacity = '1.0'
                  }}
                  onMouseLeave={(event: any) => {
                    event.target.style.opacity = opacity
                  }}
                >
                  {t}
                </div>
              </div>
            )
          })}
        </div>
        <span
          onMouseEnter={(event: any) => {
            event.target.style.opacity = '1.0'
          }}
          onMouseLeave={(event: any) => {
            event.target.style.opacity = '0.3'
          }}
          style={{ fontSize: '10px', opacity: 0.3, cursor: 'pointer' }}
          onClick={openCurrentSessionFile}
        >
          Open session file
        </span>
      </div>
      <VSCodeDivider style={{ margin: 0, padding: 0 }} />
    </div>
  )
}
