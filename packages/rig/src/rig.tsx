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
  blocks: GlassBlock[]
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const initialBlocks: GlassBlock[] = [
    {
      role: 'assistant',
      content: 'Welcome to Glass support. How can I help you today?',
    },
  ]
  const [blocks, setBlocks] = useState<GlassBlock[]>(initialBlocks)

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setBlocks':
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
    setBlocks(initialBlocks)
    document.getElementById('composer-input')?.focus()
  }

  const send = (text: string) => {
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
      <TopperView reset={reset} />
      <BlocksView blocks={blocks} />
      <ComposerView send={send} />
    </div>
  )
}
