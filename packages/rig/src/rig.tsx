import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ChatView } from './ChatView'
import { GlassView } from './GlassView'
import { LogsView } from './LogsView'
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
  const tabs: string[] = ['Chat', 'File', 'Tests', 'Logs']
  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')
  const [blocks, setBlocks] = useState<GlassBlock[]>([])
  const [variables, setVariables] = useState<string[]>([])
  const [didRun, setDidRun] = useState(false)
  const [playgroundId, setPlaygroundId] = useState(getNonce())

  const [tab, setTab] = useState(tabs[0])

  useEffect(() => {
    vscode.postMessage({
      action: 'getFilename',
    })
  }, [])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setFilename':
          setFilename(() => message.data.filename)
          break
        case 'setGlass':
          setGlass(() => message.data.glass)
          setBlocks(() => message.data.blocks)
          setVariables(() => message.data.variables)
          if (message.data.variables.length > 0) {
            setTimeout(() => {
              document.getElementById('composer-input-0')?.focus()
            }, 500)
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
  }, [])

  useEffect(() => {
    if (filename.length > 0) {
      reset()
    }
  }, [filename])

  const reset = () => {
    setPlaygroundId(getNonce())
    vscode.postMessage({
      action: 'resetGlass',
    })
  }

  const transpile = () => {
    vscode.postMessage({
      action: 'transpileGlass',
    })
  }

  const send = (values: Record<string, string>) => {
    setDidRun(true)
    vscode.postMessage({
      action: 'runPlayground',
      data: {
        values,
        glass,
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
      <TopperView transpile={transpile} tab={tab} setTab={setTab} tabs={tabs} filename={filename} reset={reset} />
      {tab === 'Chat' && (
        <ChatView variables={variables} send={send} playgroundId={playgroundId} blocks={didRun ? blocks : []} />
      )}
      {tab === 'File' && <GlassView glass={glass} />}
      {tab === 'Logs' && <LogsView glass={glass} />}
    </div>
  )
}
