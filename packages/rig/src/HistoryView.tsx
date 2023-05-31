import { VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow, VSCodeLink } from '@vscode/webview-ui-toolkit/react'
import { GlassLog } from './rig'

interface HistoryViewProps {
  logs: GlassLog[]
  openGlass: (glass: string) => void
}

export const HistoryView = (props: HistoryViewProps) => {
  const { logs, openGlass } = props

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
      {logs.length === 0 ? (
        <div style={{ fontStyle: 'italic', fontWeight: 'bold', width: '100%', textAlign: 'center', opacity: 0.5 }}>
          No history yet
        </div>
      ) : (
        <VSCodeDataGrid>
          <VSCodeDataGridRow row-type="header">
            <VSCodeDataGridCell cell-type="columnheader" grid-column="1">
              ID
            </VSCodeDataGridCell>
            <VSCodeDataGridCell cell-type="columnheader" grid-column="2">
              Session
            </VSCodeDataGridCell>
            <VSCodeDataGridCell cell-type="columnheader" grid-column="3">
              Model
            </VSCodeDataGridCell>
            <VSCodeDataGridCell cell-type="columnheader" grid-column="4">
              Inputs
            </VSCodeDataGridCell>
            <VSCodeDataGridCell cell-type="columnheader" grid-column="5">
              Output
            </VSCodeDataGridCell>
          </VSCodeDataGridRow>
          {logs
            .slice()
            .reverse()
            .map(log => (
              <VSCodeDataGridRow key={log.id}>
                <VSCodeDataGridCell grid-column="1">
                  <VSCodeLink href={'#'} onClick={() => openGlass(log.glass)}>
                    {log.id}
                  </VSCodeLink>
                </VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="2">{log.session}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="3">{log.model}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="4">{truncate(log.input)}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="5">{truncate(log.output)}</VSCodeDataGridCell>
              </VSCodeDataGridRow>
            ))}
        </VSCodeDataGrid>
      )}
    </div>
  )
}
