import { GlassContent } from '@glass-lang/glasslib'
import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { HistoryView } from './HistoryView'
import { TopperView } from './TopperView'
import { getNonce, lastElement } from './util'

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
  const tabs: string[] = ['View', 'History']

  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')
  const [currentSource, setCurrentSource] = useState('')
  const [originalSource, setOriginalSource] = useState('')
  const [blocks, setBlocks] = useState<GlassContent[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [previousInputs, setPreviousInputs] = useState<Record<string, string>>({})
  const [session, setSession] = useState(getNonce())
  const [logs, setLogs] = useState<GlassLog[]>([])
  const [tab, setTab] = useState(tabs[0])

  const updateInputsWithVariables = (variables: string[], clearAllValues?: boolean) => {
    console.log('RUNNING updateInputsWithVariables')
    console.log('variables', variables)
    console.log('initialInputs', inputs)
    console.log('clearAllValues', clearAllValues)
    const newInputs: Record<string, string> = {}
    variables.forEach(v => {
      if (clearAllValues) {
        newInputs[v] = ''
      } else {
        newInputs[v] = inputs[v] || ''
      }
    })
    console.log('newInputs', newInputs)
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
          break
        case 'onResponse':
          if (message.data.session !== session) {
            break
          }
          setGlass(() => message.data.glass)
          setBlocks(() => message.data.blocks)
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
    setPreviousInputs(inputs)
    vscode.postMessage({
      action: 'runGlass',
      data: {
        inputs,
        glass,
        session,
      },
    })
    updateInputsWithVariables(Object.keys(inputs), true)
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
  const streaming = lastElement(assistantBlocks)?.child?.content.includes('█') === true

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
        session={session}
        openCurrentGlass={() => openGlass(glass)}
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
      {tab === 'History' && <HistoryView logs={logs} openGlass={openGlass} />}
      {tab === 'View' && (Object.keys(inputs).length > 0 || streaming || blocks.some(b => b.tag === 'Request')) && (
        <ComposerView run={run} stop={stop} streaming={streaming} inputs={inputs} setInputs={setInputs} />
      )}
    </div>
  )
}
