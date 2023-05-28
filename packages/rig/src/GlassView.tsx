interface GlassViewProps {
  glass: string
}

export const GlassView = (props: GlassViewProps) => {
  const { glass } = props

  return <div style={{ whiteSpace: 'pre-line' }}>{glass}</div>
}
