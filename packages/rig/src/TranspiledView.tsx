interface TranspiledViewProps {
  code: string
  languageId: string
}

export const TranspiledView = (props: TranspiledViewProps) => {
  const { code, languageId } = props

  console.log(`language-${languageId.replace('glass-', '')}`)

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
      {code}
    </div>
  )
}
