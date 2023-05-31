import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'

interface RawViewProps {
  glass: string
  session: string
  openGlass: (glass: string) => void
}

export const RawView = (props: RawViewProps) => {
  const { glass, session, openGlass } = props

  return (
    <div
      style={{
        width: '100%',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          paddingTop: '16px',
          paddingBottom: '16px',
          display: 'flex',
          paddingLeft: '12px',
          paddingRight: '12px',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontWeight: 'bolder', opacity: 0.8 }}>
            Session: <span style={{ fontFamily: 'monospace' }}>{session}</span>
          </div>
          <div
            onMouseEnter={(event: any) => {
              event.target.style.opacity = '1.0'
            }}
            onMouseLeave={(event: any) => {
              event.target.style.opacity = '0.5'
            }}
            style={{ fontSize: '12px', opacity: 0.5, cursor: 'pointer' }}
            onClick={() => openGlass(glass)}
          >
            Open in editor
          </div>
        </div>
        <div style={{ paddingTop: '16px', paddingBottom: '16px' }}>
          <VSCodeDivider />
        </div>
        <div
          style={{
            height: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
            display: 'flex',
          }}
        >
          <span style={{ whiteSpace: 'pre-line' }}>{glass}</span>
        </div>
      </div>
    </div>
  )
}
