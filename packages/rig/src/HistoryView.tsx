import { VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow, VSCodeLink } from '@vscode/webview-ui-toolkit/react'
import { GlassLog } from './rig'

interface HistoryViewProps {
  logs: GlassLog[]
  onOpenGlass: (glass: string) => void
}

export const HistoryView = (props: HistoryViewProps) => {
  const { logs, onOpenGlass } = props

  return (
    <div
      style={{
        paddingTop: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        height: '100%',
      }}
    >
      {logs.length === 0 ? (
        <div style={{ fontStyle: 'italic', width: '100%', textAlign: 'center', opacity: 0.5 }}>No history yet</div>
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
              Input
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
                  <VSCodeLink href={'#'} onClick={() => onOpenGlass(log.glass)}>
                    {log.id}
                  </VSCodeLink>
                </VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="2">{log.session}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="3">{log.model}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="4">{log.input}</VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="5">{log.output}</VSCodeDataGridCell>
              </VSCodeDataGridRow>
            ))}
        </VSCodeDataGrid>
      )}
    </div>
  )
}
