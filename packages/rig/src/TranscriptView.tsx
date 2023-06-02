import { GlassContent } from '@glass-lang/glasslib'
import { useEffect, useRef, useState } from 'react'

interface TranscriptViewProps {
  blocks: GlassContent[]
  session: string
}

export const TranscriptView = (props: TranscriptViewProps) => {
  const { blocks, session } = props
  const [autoScroll, setAutoScroll] = useState(true)
  const chatContainer = useRef<HTMLDivElement | null>(null)

  const colorLookup: Record<string, string> = {
    User: '#5EC5E5',
    Assistant: '#4EC9B0',
  }

  const handleScroll = () => {
    if (!chatContainer.current) return

    const { scrollTop, scrollHeight, clientHeight } = chatContainer.current
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5

    setAutoScroll(atBottom)
  }

  useEffect(() => {
    // Attach the scroll event handler
    const current = chatContainer.current
    chatContainer.current?.addEventListener('scroll', handleScroll)

    // Detach the handler when the component unmounts
    return () => {
      current?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Only scroll automatically if the user is at the bottom of the chat
    if (autoScroll) {
      document.getElementById('end')?.scrollIntoView()
    }
  }, [blocks, autoScroll])

  function requestSummary(block: GlassContent): string | undefined {
    const modelAttr = block.attrs?.find(attr => attr.name === 'model')
    if (block.tag !== 'Assistant' || !modelAttr) {
      return undefined
    }
    return modelAttr.stringValue
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        ref={chatContainer}
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
            fontSize: '10px',
            opacity: 0.3,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {session}
        </div>
        {blocks.map((block, index) => {
          const summary = requestSummary(block)
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: '36px',
                fontStyle: block.tag === 'System' ? 'italic' : 'normal',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: block.tag ? colorLookup[block.tag] : undefined,

                    fontSize: '12px',
                  }}
                >
                  {block.tag}
                </span>
                {summary && <span style={{ fontFamily: 'monospace', opacity: 0.5, fontSize: '10px' }}>{summary}</span>}
              </div>
              <span style={{ whiteSpace: 'pre-wrap' }}>{block.child?.content}</span>
            </div>
          )
        })}
        <div id={'end'} style={{ width: '100%', height: '0px' }} />
      </div>
    </div>
  )
}
