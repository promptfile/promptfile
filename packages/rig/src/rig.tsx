import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ComposerView } from './ComposerView'
import { TopperView } from './TopperView'

export interface RigState {
  filename: string
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const [filename, setFilename] = useState('')

  // when the webview loads, send a message to the extension to get the openai key
  useEffect(() => {
    vscode.postMessage({
      action: 'getFilename',
    })
    console.log('getFilename')
  }, [])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setFilename':
          setFilename(() => message.data.filename)
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

  const reset = () => {
    vscode.postMessage({
      action: 'reset',
    })
  }

  const send = (text: string) => {
    vscode.postMessage({
      action: 'send',
      data: {
        filename,
        text,
      },
    })
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopperView filename={filename} reset={reset} />
      <ComposerView send={send} />
    </div>
  )
}
