import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'

interface RawViewProps {
  glass: string
  session: string
  openGlass: (glass: string) => void
}

export const RawView = (props: RawViewProps) => {
  const { glass, session, openGlass } = props

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ width: '100%', flexShrink: 0 }}>
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
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ opacity: 0.8 }}>
              Session: <span style={{ fontFamily: 'monospace' }}>{session}</span>
            </div>
          </div>
          <span
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
          </span>
        </div>
        <div style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <VSCodeDivider style={{ margin: 0, padding: 0 }} />
        </div>
      </div>
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
        <div
          style={{
            whiteSpace: 'pre-line',
            paddingTop: '16px',
            paddingBottom: '16px',
          }}
        >
          {glass}
        </div>
      </div>
    </div>
  )
}
