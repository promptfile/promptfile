import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { ComposerView } from './ComposerView'
import { GlassView } from './GlassView'
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
  const [glass, setGlass] = useState('')
  const [blocks, setBlocks] = useState<GlassBlock[]>([])
  const [values, setValues] = useState<Record<string, string>>({})

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setFilename':
          const newFilename = message.data.filename
          if (newFilename && newFilename.includes('.glass')) {
            setFilename(() => newFilename.replace('.glass', ''))
          }
          break
        case 'setGlass':
          const newGlass = message.data.glass
          if (newGlass) {
            setGlass(() => newGlass)
          }
          const variables = message.data.variables
          if (variables) {
            const newValues = Object.fromEntries(
              (variables as string[]).map(variable => [variable, values.variable ?? ''])
            )
            setValues(() => newValues)
          }
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
    vscode.postMessage({
      action: 'getFilename',
    })
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

  const send = () => {
    vscode.postMessage({
      action: 'runPlayground',
      data: {
        glass,
        values,
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
        justifyContent: 'space-between',
      }}
    >
      <TopperView filename={filename} reset={reset} />
      {/* <BlocksView blocks={blocks} /> */}
      <GlassView glass={glass} />
      <ComposerView
        send={send}
        values={values}
        setValue={(variable, value) => setValues({ ...values, [variable]: value })}
      />
    </div>
  )
}
