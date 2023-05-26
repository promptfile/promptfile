interface HistoryViewProps {
  glass: string
}

export const HistoryView = (props: HistoryViewProps) => {
  const { glass } = props

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <div
        style={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          overflowY: 'scroll',
          overflowX: 'hidden',
          height: '100%',
        }}
      >
        <div style={{ width: '100%', height: '16px' }} />
        <div style={{ whiteSpace: 'pre-line', paddingLeft: '16px', paddingRight: '16px', fontStyle: 'italic' }}>
          Coming soon!
        </div>
      </div>
    </div>
  )
}
