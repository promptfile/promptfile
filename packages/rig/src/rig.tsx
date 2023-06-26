import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { HistoryView } from './HistoryView'
import { SessionView } from './SessionView'
import { TopperView } from './TopperView'
import { lastElement } from './util'

export interface ChatBlock {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  type?: 'function_call'
}

export interface GlassSession {
  session: string
  numMessages: number
  lastMessage: string
}

interface RigState {
  filename: string
  tab: string
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const tabs: string[] = ['Session', 'History']

  const [theme, setTheme] = useState('')
  const [requestId, setRequestId] = useState('')
  const [filename, setFilename] = useState('')
  const [currentSource, setCurrentSource] = useState('')
  const [source, setSource] = useState('')
  const [blocks, setBlocks] = useState<ChatBlock[]>([])
  const [variables, setVariables] = useState<string[]>([])
  const [session, setSession] = useState('')
  const [sessions, setSessions] = useState<GlassSession[]>([])
  const [tab, setTab] = useState(tabs[0])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'onDidChangeTextDocument':
          setCurrentSource(() => message.data.currentSource)
          break
        case 'setSessions':
          setSessions(() => message.data.sessions)
          break
        case 'setGlass':
          if (message.data.currentSource) {
            setCurrentSource(() => message.data.currentSource)
          }
          if (message.data.source) {
            setSource(() => message.data.source)
          }
          if (message.data.filename) {
            setFilename(() => message.data.filename)
          }
          let isNewSession = false
          if (message.data.session) {
            isNewSession = message.data.session !== session
            setSession(() => message.data.session)
          }
          if (message.data.theme) {
            setTheme(() => message.data.theme)
          }
          setBlocks(() => message.data.blocks)
          setVariables(() => message.data.variables)
          if (isNewSession && message.data.variables.length === 0 && message.data.blocks.some(b => b.role === 'user')) {
            vscode.postMessage({
              action: 'runSession',
              data: {
                session: message.data.session,
              },
            })
          }
          break
        case 'onStream':
          if (message.data.session !== session) {
            break
          }
          setBlocks(() => message.data.blocks)
          if (message.data.requestId) {
            setRequestId(() => message.data.requestId)
          }
          if (message.data.variables) {
            setVariables(() => message.data.variables)
          }
          break
        case 'onResponse':
          if (message.data.session !== session) {
            break
          }
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
  }, [session, sessions])

  useEffect(() => {
    vscode.postMessage({
      action: 'getCurrentSession',
    })

    window.addEventListener('keydown', event => {
      if (event.metaKey && event.key === 'r') {
        event.preventDefault()
        reload()
      }
    })
  }, [])

  const reload = () => {
    vscode.postMessage({
      action: 'resetSession',
    })
  }

  const runChat = (chatToRun: string) => {
    vscode.postMessage({
      action: 'runSession',
      data: {
        chat: chatToRun,
        session,
      },
    })
  }

  const interpolateVariables = (inputs: Record<string, string>) => {
    vscode.postMessage({
      action: 'interpolateVariables',
      data: {
        inputs: inputs,
        session,
      },
    })
  }

  const openCurrentSessionFile = () => {
    openSession(session)
  }

  const shareCurrentSessionGist = () => {
    shareSession(session)
  }

  const openSession = (sessionToOpen: string) => {
    vscode.postMessage({
      action: 'openSessionFile',
      data: {
        session: sessionToOpen,
      },
    })
  }

  const shareSession = (sessionToShare: string) => {
    vscode.postMessage({
      action: 'shareSessionGist',
      data: {
        session: sessionToShare,
      },
    })
  }

  const stop = () => {
    vscode.postMessage({
      action: 'stopSession',
      data: {
        session,
        requestId,
      },
    })
  }

  useEffect(() => {
    if (tab === 'History') {
      vscode.postMessage({
        action: 'getSessions',
      })
    }
  }, [tab])

  const assistantBlocks = blocks.filter(b => b.role === 'assistant')
  const streaming = lastElement(assistantBlocks)?.child?.content.includes('█') === true
  const dirty = source !== currentSource

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
      <TopperView
        openCurrentSessionFile={openCurrentSessionFile}
        shareCurrentSessionGist={shareCurrentSessionGist}
        dirty={dirty}
        reloadable={assistantBlocks.length > 0 || dirty}
        tab={tab}
        setTab={setTab}
        tabs={tabs}
        filename={filename}
        reload={reload}
      />
      {tab === 'Session' && (
        <SessionView
          variables={variables}
          theme={theme}
          runChat={runChat}
          interpolateVariables={interpolateVariables}
          stop={stop}
          streaming={streaming}
          session={session}
          blocks={blocks}
        />
      )}
      {tab === 'History' && <HistoryView openSession={openSession} sessions={sessions} />}
    </div>
  )
}
