interface RawViewProps {
  glass: string
}

export const RawView = (props: RawViewProps) => {
  const { glass } = props

  return (
    <div
      style={{
        paddingTop: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        whiteSpace: 'pre-line',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {glass}
    </div>
  )
}
