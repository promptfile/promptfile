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
  sessionId: string
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
  const [currentSource, setCurrentSource] = useState('')
  const [source, setSource] = useState('')
  const [blocks, setBlocks] = useState<GlassContent[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [sessionId, setSession] = useState('')
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
          if (message.data.sessionId) {
            setSession(() => message.data.sessionId)
          }
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
                sessionId: message.data.sessionId,
              },
            })
          }
          break
        case 'onStream':
          if (message.data.sessionId !== sessionId) {
            break
          }
          setBlocks(() => message.data.blocks)
          break
        case 'onResponse':
          if (message.data.sessionId !== sessionId) {
            break
          }
          setBlocks(() => message.data.blocks)
          setLogs([...logs, { ...message.data, id: getNonce(), sessionId, timestamp: new Date().toISOString() }])
          break
        default:
          break
      }
    }
    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [sessionId, logs])

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

  const run = (inputs: Record<string, string>) => {
    vscode.postMessage({
      action: 'runSession',
      data: {
        inputs,
        sessionId,
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
        sessionId,
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
        sessionId,
      },
    })
  }

  const assistantBlocks = blocks.filter(b => b.tag === 'Assistant')
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
        sessionId={sessionId}
        openSessionFile={openSessionFile}
        dirty={dirty}
        reloadable={assistantBlocks.length > 0 || dirty}
        tab={tab}
        setTab={setTab}
        tabs={tabs}
        filename={filename}
        reload={reload}
        openOutput={openOutput}
      />
      {tab === 'Transcript' && <TranscriptView sessionId={sessionId} blocks={blocks} />}
      {tab === 'History' && <HistoryView logs={logs} openGlass={openGlass} />}
      {tab === 'Transcript' && (streaming || Object.keys(inputs).length > 0) && (
        <ComposerView
          reload={reload}
          run={run}
          stop={stop}
          streaming={streaming}
          inputs={inputs}
          setInputs={setInputs}
        />
      )}
    </div>
  )
}
