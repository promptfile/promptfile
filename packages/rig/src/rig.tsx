import { GlassContent } from '@glass-lang/glasslib'
import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ComposerView } from './ComposerView'
import { HistoryView } from './HistoryView'
import { TopperView } from './TopperView'
import { TranscriptView } from './TranscriptView'
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
  const tabs: string[] = ['Transcript', 'History']

  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')
  const [currentSource, setCurrentSource] = useState('')
  const [originalSource, setOriginalSource] = useState('')
  const [blocks, setBlocks] = useState<GlassContent[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [session, setSession] = useState('')
  const [logs, setLogs] = useState<GlassLog[]>([])
  const [tab, setTab] = useState(tabs[0])

  const updateInputsWithVariables = (variables: string[], clearAllValues?: boolean) => {
    const newInputs: Record<string, string> = {}
    variables.forEach(v => {
      if (clearAllValues) {
        newInputs[v] = ''
      } else {
        newInputs[v] = inputs[v] || ''
      }
    })
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
        case 'setSession':
          const initialGlass = message.data.glass
          setSession(() => message.data.session)
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
              action: 'runSession',
              data: {
                inputs: {},
                glass: initialGlass,
                session: message.data.session,
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
      action: 'getGlass',
      data: {
        session,
      },
    })
  }, [])

  const reset = () => {
    vscode.postMessage({
      action: 'resetSession',
    })
  }

  const run = (inputs: Record<string, string>) => {
    vscode.postMessage({
      action: 'runSession',
      data: {
        inputs,
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

  const openSessionFile = () => {
    vscode.postMessage({
      action: 'openSessionFile',
      data: {
        session,
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
        openSessionFile={openSessionFile}
        dirty={originalSource !== currentSource}
        reloadable={glass !== originalSource || originalSource !== currentSource}
        tab={tab}
        setTab={setTab}
        tabs={tabs}
        filename={filename}
        reset={reset}
        openOutput={openOutput}
      />
      {tab === 'Transcript' && <TranscriptView session={session} blocks={blocks} />}
      {tab === 'History' && <HistoryView logs={logs} openGlass={openGlass} />}
      {tab === 'Transcript' && (streaming || (glass.includes('<Request') && Object.keys(inputs).length > 0)) && (
        <ComposerView run={run} stop={stop} streaming={streaming} inputs={inputs} setInputs={setInputs} />
      )}
    </div>
  )
}
