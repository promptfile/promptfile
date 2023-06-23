import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ComposerView } from './ComposerView'
import { HistoryView } from './HistoryView'
import { TopperView } from './TopperView'
import { TranscriptView } from './TranscriptView'
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
  const tabs: string[] = ['Transcript', 'History']

  const [theme, setTheme] = useState('')
  const [requestId, setRequestId] = useState('')
  const [filename, setFilename] = useState('')
  const [currentSource, setCurrentSource] = useState('')
  const [source, setSource] = useState('')
  const [blocks, setBlocks] = useState<ChatBlock[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [session, setSession] = useState('')
  const [sessions, setSessions] = useState<GlassSession[]>([])
  const [tab, setTab] = useState(tabs[0])

  const setValue = (key: string, value: string) => {
    setInputs({ ...inputs, [key]: value })
  }

  const updateInputsWithVariables = (variables: string[], clearAllValues?: boolean) => {
    const newInputs: Record<string, string> = {}
    variables.forEach(v => {
      if (clearAllValues) {
        newInputs[v] = ''
      } else {
        newInputs[v] = inputs[v] || ''
      }
    })
    if (variables.length === 0) {
      newInputs['nextUserBlock'] = ''
    }
    setInputs(() => newInputs)
  }

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
          if (message.data.session) {
            setSession(() => message.data.session)
          }
          if (message.data.theme) {
            setTheme(() => message.data.theme)
          }
          setBlocks(() => message.data.blocks)
          updateInputsWithVariables(message.data.variables)
          if (message.data.variables.length > 0 && !message.data.testing) {
            setTimeout(() => {
              document.getElementById('composer-input-0')?.focus()
            }, 100)
          } else {
            vscode.postMessage({
              action: 'runSession',
              data: {
                inputs: {},
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
          break
        case 'onResponse':
          if (message.data.session !== session) {
            break
          }
          setBlocks(() => message.data.blocks)
          updateInputsWithVariables(message.data.variables)
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

  const run = (inputsToRun: Record<string, string>, sessionToRun: string) => {
    if (!Object.values(inputsToRun).some(v => v.trim().length > 0)) {
      return
    }
    vscode.postMessage({
      action: 'runSession',
      data: {
        inputs: inputsToRun,
        session: sessionToRun,
      },
    })
    updateInputsWithVariables(Object.keys(inputsToRun), true)
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

  const openOutput = () => {
    vscode.postMessage({
      action: 'openOutput',
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
        openOutput={openOutput}
      />
      {tab === 'Transcript' && <TranscriptView session={session} blocks={blocks} />}
      {/* {tab === 'State' && <StateView />} */}
      {tab === 'History' && <HistoryView openSession={openSession} sessions={sessions} />}
      {tab === 'Transcript' && (
        <ComposerView
          theme={theme}
          reload={reload}
          run={run}
          stop={stop}
          streaming={streaming}
          inputs={inputs}
          setValue={setValue}
          session={session}
        />
      )}
    </div>
  )
}
