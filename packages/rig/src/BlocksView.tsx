import { GlassBlock } from './rig'

interface BlocksViewProps {
  blocks: GlassBlock[]
}

export const BlocksView = (props: BlocksViewProps) => {
  const { blocks } = props

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', paddingTop: '16px' }}
    >
      {blocks
        .filter(block => block.role !== 'system')
        .map((block, index) => (
          <span
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '24px',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
            id={`message.${index}`}
          >
            <span style={{ fontWeight: 'bold', opacity: 0.5, fontSize: '14px', paddingBottom: '2px' }}>
              {block.role === 'user' ? 'User' : 'Assistant'}
            </span>
            {block.content}
          </span>
        ))}
    </div>
  )
}
