import { useState } from 'react'

interface ConsoleViewProps {
  session: string
}

export const ConsoleView = (props: ConsoleViewProps) => {
  const { session } = props

  const [timestamp, setTimestamp] = useState(new Date().toISOString())

  return (
    <div style={{ overflow: 'hidden', height: '100%', background: 'black' }}>
      <div
        style={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          overflowY: 'scroll',
          overflowX: 'hidden',
          height: '100%',
          fontFamily: 'monospace',
          paddingLeft: '8px',
          paddingRight: '8px',
          paddingTop: '8px',
          paddingBottom: '8px',
        }}
      >
        <span>
          <span style={{ opacity: 0.5 }}>{timestamp.replace('Z', '')}</span>
          <span style={{ paddingLeft: '12px' }}>
            New session created: <span style={{ color: '#4AF626' }}>{session}</span>
          </span>
        </span>
      </div>
    </div>
  )
}
