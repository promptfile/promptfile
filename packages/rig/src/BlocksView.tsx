import { useEffect } from 'react'
import { GlassBlock } from './rig'

interface BlocksViewProps {
  blocks: GlassBlock[]
}

export const BlocksView = (props: BlocksViewProps) => {
  const { blocks } = props

  useEffect(() => {
    const element = document.getElementById(`end`)
    if (element) {
      element.scrollIntoView({ behavior: 'auto' })
    }
  }, [blocks.length])

  return (
    <>
      {blocks.map((block, index) => (
        <span
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '24px',
          }}
        >
          <span style={{ fontWeight: 'bold', opacity: 0.5, fontSize: '12px', paddingBottom: '4px' }}>{block.tag}</span>
          <span style={{ whiteSpace: 'pre-line' }}>{block.content}</span>
        </span>
      ))}
      <div id={'end'} style={{ width: '100%', height: '0px' }} />
    </>
  )
}
