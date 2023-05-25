import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { TopperView } from './TopperView'

export interface GlassBlock {
  content: string
  tag: 'User' | 'Assistant' | 'System'
}

export interface RigState {
  blocks: GlassBlock[]
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const [filename, setFilename] = useState('')
  const [blocks, setBlocks] = useState<GlassBlock[]>([])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setData':
          const newFilename = message.data.filename
          if (newFilename && newFilename.includes('.glass')) {
            setFilename(() => newFilename.replace('.glass', ''))
          }
          const newBlocks = message.data.blocks
          if (newBlocks != null) {
            setBlocks(() => newBlocks)
          }
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
    vscode.postMessage({
      action: 'getData',
    })
  }, [])

  const reset = () => {
    document.getElementById('composer-input')?.focus()
  }

  const send = (text: string) => {
    console.log('sending: ' + text)
  }

  return (
    <div
      style={{
        flexDirection: 'column',
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        justifyContent: 'space-between',
      }}
    >
      <TopperView filename={filename} reset={reset} />
      <BlocksView blocks={blocks} />
      <ComposerView send={send} />
    </div>
  )
}
