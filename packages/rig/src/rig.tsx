import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ChatView } from './ChatView'
import { HistoryView } from './HistoryView'
import { ConsoleView } from './LogsView'
import { StorageView } from './StorageView'
import { TopperView } from './TopperView'
import { getNonce } from './nonce'

export interface GlassBlock {
  tag: string
  content: string
}

interface RigState {
  filename: string
  tab: string
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const tabs: string[] = ['Chat', 'Storage', 'Console', 'History']
  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')
  const [blocks, setBlocks] = useState<GlassBlock[]>([])
  const [variables, setVariables] = useState<string[]>([])
  const [session, setSession] = useState(getNonce())

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
          break
        default:
          break
      }
    }
    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [session])

  useEffect(() => {
    vscode.postMessage({
      action: 'getGlass',
    })
  }, [])

  const reset = () => {
    setSession(getNonce())
    vscode.postMessage({
      action: 'resetGlass',
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
      <TopperView tab={tab} setTab={setTab} tabs={tabs} filename={filename} reset={reset} />
      {tab === 'Chat' && <ChatView variables={variables} send={send} session={session} blocks={blocks} />}
      {tab === 'Storage' && <StorageView glass={glass} />}
      {tab === 'Console' && <ConsoleView session={session} />}
      {tab === 'History' && <HistoryView glass={glass} />}
    </div>
  )
}
