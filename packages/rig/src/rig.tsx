import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ComposerView } from './ComposerView'
import { FileTopper } from './FileTopper'

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
      <FileTopper filename={filename} />
      <ComposerView vscode={vscode} />
    </div>
  )
}
