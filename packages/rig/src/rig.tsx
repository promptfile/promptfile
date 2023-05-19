import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { TopperView } from './TopperView'

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
  }, [])

  const reset = () => {
    vscode.postMessage({
      action: 'reset',
      data: {
        filename,
      },
    })
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

  useEffect(() => {
    const element = document.getElementById(`message.${blocks.length - 1}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, [blocks.length])

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
      <div style={{ flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <TopperView filename={filename} reset={reset} />
        <BlocksView blocks={blocks} />
      </div>
      <ComposerView send={send} />
    </div>
  )
}
