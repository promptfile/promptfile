import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { HistoryView } from './HistoryView'
import { RawView } from './RawView'
import { TopperView } from './TopperView'

export interface GlassBlock {
  content: string
  tag: 'User' | 'Assistant' | 'System'
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
          setVariables(() => message.data.variables)
          setBlocks(() => message.data.blocks)
          setTimeout(() => {
            document.getElementById('composer-input-0')?.focus()
          }, 500)
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
    vscode.postMessage({
      action: 'resetGlass',
    })
  }

  const send = (values: Record<string, string>) => {
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
      <TopperView tab={tab} setTab={setTab} tabs={tabs} filename={filename} reset={reset} />
      {tab === 'Chat' && <BlocksView blocks={blocks} />}
      {tab === 'Raw' && <RawView glass={glass} />}
      {tab === 'History' && <HistoryView glass={glass} />}
      <ComposerView send={send} variables={variables} />
    </div>
  )
}
