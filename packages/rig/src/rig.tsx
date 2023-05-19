import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { TopperView } from './TopperView'
import { getNonce } from './nonce'

export interface GlassBlock {
  content: string
  role: 'user' | 'assistant' | 'system'
}

export interface RigState {
  filename: string
  blocks: GlassBlock[]
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const [playgroundId, setPlaygroundId] = useState(getNonce())
  const [filename, setFilename] = useState('')
  const [blocks, setBlocks] = useState<GlassBlock[]>([])

  // when the webview loads, send a message to the extension to get the openai key
  useEffect(() => {
    vscode.postMessage({
      action: 'getFilename',
    })
  }, [])

  useEffect(() => {
    if (filename.length > 0) {
      vscode.postMessage({
        action: 'getBlocks',
        data: {
          filename,
        },
      })
    }
  }, [filename])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setFilename':
          setFilename(() => message.data.filename)
          break
        case 'setBlocks':
          if (message.data.filename !== filename) {
            return
          }
          setBlocks(() => message.data.blocks)
        default:
          break
      }
    }

    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [filename])

  const reset = () => {
    vscode.postMessage({
      action: 'reset',
      data: {
        filename,
      },
    })
    setPlaygroundId(getNonce())
    setBlocks([])
    document.getElementById('composer-input')?.focus()
  }

  const send = (text: string) => {
    vscode.postMessage({
      action: 'createBlock',
      data: {
        filename,
        text,
      },
    })
    setBlocks([...blocks, { content: text, role: 'user' }])
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
      <TopperView filename={filename} reset={reset} />
      <BlocksView blocks={blocks} playgroundId={playgroundId} />
      <ComposerView send={send} />
    </div>
  )
}
