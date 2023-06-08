import { VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow, VSCodeLink } from '@vscode/webview-ui-toolkit/react'
import { GlassSession } from './rig'

interface HistoryViewProps {
  sessions: GlassSession[]
  openSession: (sessionId: string) => void
}

export const HistoryView = (props: HistoryViewProps) => {
  const { sessions, openSession } = props

  function truncate(str: string | undefined, max = 36): string {
    if (!str) {
      return ''
    }
    if (str.length > max) {
      return str.substring(0, max) + '...'
    }
    return str
  }

  return (
    <div
      style={{
        paddingTop: '16px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {sessions.length === 0 ? (
        <div style={{ fontStyle: 'italic', fontWeight: 'bold', width: '100%', textAlign: 'center', opacity: 0.5 }}>
          No history yet
        </div>
      ) : (
        <VSCodeDataGrid>
          <VSCodeDataGridRow row-type="header">
            <VSCodeDataGridCell cell-type="columnheader" grid-column="1">
              Session
            </VSCodeDataGridCell>
            <VSCodeDataGridCell cell-type="columnheader" grid-column="2">
              Messages
            </VSCodeDataGridCell>
            <VSCodeDataGridCell cell-type="columnheader" grid-column="3">
              Last
            </VSCodeDataGridCell>
          </VSCodeDataGridRow>
          {sessions
            .slice()
            .reverse()
            .map(session => (
              <VSCodeDataGridRow key={session.session}>
                <VSCodeDataGridCell grid-column="1">
                  <VSCodeLink href={'#'} onClick={() => openSession(session.session)}>
                    {session.session.split('/').pop()?.replace('.glass', '')}
                  </VSCodeLink>
                </VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="2">{session.numMessages}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="3">{truncate(session.lastMessage)}</VSCodeDataGridCell>
              </VSCodeDataGridRow>
            ))}
        </VSCodeDataGrid>
      )}
    </div>
  )
}
