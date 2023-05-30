import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ChatView } from './ChatView'
import { HistoryView } from './HistoryView'
import { RawView } from './RawView'
import { TopperView } from './TopperView'
import { getNonce } from './nonce'

export interface GlassBlock {
  tag: string
  content: string
}

export interface GlassLog {
  id: string
  session: string
  timestamp?: string
  model?: string
  input?: string
  output?: string
  glass: string
}

interface RigState {
  filename: string
  tab: string
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const tabs: string[] = ['Chat', 'Raw', 'History']
  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')
  const [blocks, setBlocks] = useState<GlassBlock[]>([])
  const [variables, setVariables] = useState<string[]>([])
  const [session, setSession] = useState(getNonce())
  const [logs, setLogs] = useState<GlassLog[]>([])

  const [tab, setTab] = useState(tabs[0])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setGlass':
          if (message.data.session && message.data.session !== session) {
            return
          }
          if (message.data.filename) {
            setFilename(() => message.data.filename)
          }
          setGlass(() => message.data.glass)
          setBlocks(() => message.data.blocks)
          setVariables(() => message.data.variables)
          if (message.data.session && message.data.output) {
            setLogs([...logs, { ...message.data, id: getNonce(), session, timestamp: new Date().toISOString() }])
          }
          break
        default:
          break
      }
    }
    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [session, logs])

  useEffect(() => {
    vscode.postMessage({
      action: 'getGlass',
      data: {
        session,
      },
    })
  }, [])

  const reset = () => {
    const newSession = getNonce()
    setSession(newSession)
    vscode.postMessage({
      action: 'resetGlass',
      data: {
        session: newSession,
      },
    })
  }

  const send = (text: string) => {
    vscode.postMessage({
      action: 'sendText',
      data: {
        text,
        glass,
        session,
      },
    })
  }

  const onOpenGlass = (glass: string) => {
    vscode.postMessage({
      action: 'openGlass',
      data: {
        glass,
      },
    })
  }

  const openOutput = () => {
    vscode.postMessage({
      action: 'openOutput',
    })
  }

  const stop = () => {
    vscode.postMessage({
      action: 'stopGlass',
      data: {
        session,
      },
    })
  }

  return (
    <div
      style={{
        flexDirection: 'column',
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <TopperView tab={tab} setTab={setTab} tabs={tabs} filename={filename} reset={reset} openOutput={openOutput} />
      {tab === 'Chat' && <ChatView stop={stop} send={send} session={session} blocks={blocks} />}
      {tab === 'Raw' && <RawView glass={glass} />}
      {tab === 'History' && <HistoryView logs={logs} onOpenGlass={onOpenGlass} />}
    </div>
  )
}
