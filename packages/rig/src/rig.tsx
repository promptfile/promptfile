import { GlassContent } from '@glass-lang/glasslib'
import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { HistoryView } from './HistoryView'
import { RawView } from './RawView'
import { TopperView } from './TopperView'
import { getNonce } from './nonce'

export interface GlassLog {
  id: string
  session: string
  timestamp?: string
  model: string
  inputs: Record<string, string>
  output: string
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
  const tabs: string[] = ['View', 'Raw', 'History']

  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')
  const [currentSource, setCurrentSource] = useState('')
  const [originalSource, setOriginalSource] = useState('')
  const [blocks, setBlocks] = useState<GlassContent[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [session, setSession] = useState(getNonce())
  const [logs, setLogs] = useState<GlassLog[]>([])
  const [tab, setTab] = useState(tabs[0])

  const updateInputsWithVariables = (variables: string[], clearAllValues?: boolean) => {
    setInputs(Object.fromEntries(variables.map(v => [v, clearAllValues ? '' : inputs[v] || ''])))
  }

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'onDidChangeTextDocument':
          setCurrentSource(() => message.data.currentSource)
          break
        case 'onOpen':
          const newSession = getNonce()
          setSession(newSession)
          const initialGlass = message.data.glass
          setOriginalSource(() => message.data.originalSource)
          setCurrentSource(() => message.data.currentSource)
          setFilename(() => message.data.filename)
          setGlass(() => initialGlass)
          setBlocks(() => message.data.blocks)
          updateInputsWithVariables(message.data.variables)
          if (message.data.variables.length > 0) {
            setTimeout(() => {
              document.getElementById('composer-input-0')?.focus()
            }, 100)
          } else {
            vscode.postMessage({
              action: 'runGlass',
              data: {
                inputs: {},
                glass: initialGlass,
                session: newSession,
              },
            })
          }
          break
        case 'onStream':
          if (message.data.session !== session) {
            break
          }
          setGlass(() => message.data.glass)
          setBlocks(() => message.data.blocks)
          updateInputsWithVariables(message.data.variables)
          break
        case 'onResponse':
          if (message.data.session !== session) {
            break
          }
          setGlass(() => message.data.glass)
          setBlocks(() => message.data.blocks)
          updateInputsWithVariables(message.data.variables, true)
          setLogs([...logs, { ...message.data, id: getNonce(), session, timestamp: new Date().toISOString() }])
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
      action: 'onOpen',
      data: {
        session,
      },
    })
  }, [])

  const reset = () => {
    const newSession = getNonce()
    setSession(newSession)
    vscode.postMessage({
      action: 'onOpen',
      data: {
        session: newSession,
      },
    })
  }

  const run = (inputs: Record<string, string>) => {
    vscode.postMessage({
      action: 'runGlass',
      data: {
        inputs,
        glass,
        session,
      },
    })
  }

  const openGlass = (glass: string) => {
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
        glass,
      },
    })
  }

  const assistantBlocks = blocks.filter(b => b.tag === 'Assistant')
  const lastAssistantBlock = assistantBlocks.length > 0 ? assistantBlocks[blocks.length - 1] : null
  const streaming = lastAssistantBlock?.content.includes('█') === true

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
        dirty={originalSource !== currentSource}
        reloadable={glass !== originalSource || originalSource !== currentSource}
        tab={tab}
        setTab={setTab}
        tabs={tabs}
        filename={filename}
        reset={reset}
        openOutput={openOutput}
      />
      {tab === 'View' && <BlocksView session={session} blocks={blocks} />}
      {tab === 'Raw' && <RawView session={session} glass={glass} openGlass={openGlass} />}
      {tab === 'History' && <HistoryView logs={logs} openGlass={openGlass} />}
      {['View', 'Raw'].includes(tab) &&
        (Object.keys(inputs).length > 0 || streaming || blocks.some(b => b.tag === 'Request')) && (
          <ComposerView run={run} stop={stop} streaming={streaming} inputs={inputs} setInputs={setInputs} />
        )}
    </div>
  )
}
