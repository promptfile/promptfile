import { VSCodeButton, VSCodeLink } from '@vscode/webview-ui-toolkit/react'

interface RawViewProps {
  filename: string
  glass: string
}

export const RawView = (props: RawViewProps) => {
  const { filename, glass } = props

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <div
        style={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          overflowY: 'scroll',
          overflowX: 'hidden',
          paddingLeft: '24px',
          paddingRight: '24px',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            paddingTop: '16px',
          }}
        >
          <VSCodeLink style={{ fontWeight: 'bolder', fontStyle: 'italic' }}>
            {filename.replace('.glass', '.playground.glass')}
          </VSCodeLink>
          <VSCodeButton appearance="secondary">Copy</VSCodeButton>
        </div>
        <div style={{ width: '100%', paddingBottom: '16px' }}>
          <div
            style={{
              whiteSpace: 'pre-line',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderStyle: 'solid',
              padding: '16px',
            }}
          >
            {glass}
          </div>
        </div>
      </div>
    </div>
  )
}
