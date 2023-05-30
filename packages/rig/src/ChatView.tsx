import { useEffect } from 'react'
import { ComposerView } from './ComposerView'
import { GlassBlock } from './rig'

interface ChatViewProps {
  blocks: GlassBlock[]
  session: string
  send: (text: string) => void
}

export const ChatView = (props: ChatViewProps) => {
  const { blocks, session, send } = props

  useEffect(() => {
    document.getElementById('end')?.scrollIntoView()
  }, [blocks])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div
          style={{
            paddingTop: '16px',
            paddingBottom: '16px',
            fontFamily: 'monospace',
            fontSize: '12px',
            opacity: 0.3,
            width: '100%',
            textAlign: 'center',
          }}
        >
          session {session}
        </div>
        {blocks
          .filter(block => block.tag !== 'System' && !(block.content.startsWith('${') && block.content.endsWith('}')))
          .map((block, index) => (
            <span
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: '24px',
                fontStyle: block.tag === 'System' ? 'italic' : 'normal',
              }}
            >
              <span style={{ fontWeight: 'bold', opacity: 0.5, fontSize: '12px', paddingBottom: '4px' }}>
                {block.tag}
              </span>
              <span style={{ whiteSpace: 'pre-line' }}>{block.content}</span>
            </span>
          ))}
        <div id={'end'} style={{ width: '100%', height: '0px' }} />
      </div>
      <ComposerView send={send} />
    </div>
  )
}
