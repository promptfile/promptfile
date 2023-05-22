import { useEffect } from 'react'
import { GlassBlock } from './rig'

interface BlocksViewProps {
  blocks: GlassBlock[]
  playgroundId: string
}

export const BlocksView = (props: BlocksViewProps) => {
  const { blocks, playgroundId } = props

  const filteredBlocks = blocks.filter(block => block.role !== 'system')

  useEffect(() => {
    const element = document.getElementById(`end`)
    if (element) {
      element.scrollIntoView({ behavior: 'auto' })
    }
  }, [blocks.length])

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
        {filteredBlocks.map((block, index) => (
          <span
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '24px',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            <span style={{ fontWeight: 'bold', opacity: 0.5, fontSize: '12px', paddingBottom: '4px' }}>
              {block.role === 'user' ? 'Me' : 'Glass'}
            </span>
            {block.content}
          </span>
        ))}
        <div id={'end'} style={{ width: '100%', height: '0px' }} />
      </div>
    </div>
  )
}
