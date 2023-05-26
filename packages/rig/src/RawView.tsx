interface RawViewProps {
  glass: string
}

export const RawView = (props: RawViewProps) => {
  const { glass } = props

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <div
        style={{
          whiteSpace: 'pre-line',
          padding: '16px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {glass}
      </div>
    </div>
  )
}
