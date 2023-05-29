import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { HistoryView } from './HistoryView'
import { PlaygroundView } from './PlaygroundView'
import { TestsView } from './TestsView'
import { TopperView } from './TopperView'

interface RigState {
  filename: string
  tab: string
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const tabs: string[] = ['Playground', 'Tests', 'History']
  const [filename, setFilename] = useState('')
  const [glass, setGlass] = useState('')

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
      <TopperView tab={tab} setTab={setTab} tabs={tabs} filename={filename} />
      {tab === 'Playground' && (
        <PlaygroundView
          reset={reset}
          glass={glass}
          send={send}
          getMetadata={() => {
            vscode.postMessage({
              action: 'getMetadata',
              data: {
                glass,
              },
            })
          }}
        />
      )}
      {tab === 'Tests' && <TestsView glass={glass} />}
      {tab === 'History' && <HistoryView glass={glass} />}
    </div>
  )
}
