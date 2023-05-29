import { VSCodeButton, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { GlassView } from './GlassView'

export interface GlassBlock {
  tag: string
  content: string
}

interface PlaygroundViewProps {
  glass: string
  send: (values: Record<string, string>) => void
  reset: () => void
  getMetadata: () => void
}

export const PlaygroundView = (props: PlaygroundViewProps) => {
  const { glass, send, getMetadata, reset } = props

  const [viewStyle, setViewStyle] = useState<'chat' | 'glass'>('chat')

  const [blocks, setBlocks] = useState<GlassBlock[]>([])
  const [variables, setVariables] = useState<string[]>([])
  const [didRun, setDidRun] = useState(false)

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setMetadata':
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
    if (glass.length > 0) {
      getMetadata()
    }
  }, [glass])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div
          style={{
            paddingTop: '16px',
            paddingBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <VSCodeDropdown
            onChange={e => {
              const target = e.target as any
              const value = target.value as 'glass' | 'chat'
              setViewStyle(value)
            }}
          >
            <VSCodeOption value={'chat'} selected={viewStyle === 'chat'}>
              Chat
            </VSCodeOption>
            <VSCodeOption value={'glass'} selected={viewStyle === 'glass'}>
              Glass editor
            </VSCodeOption>
          </VSCodeDropdown>
          <VSCodeButton
            appearance="secondary"
            onClick={() => {
              setDidRun(false)
              reset()
            }}
          >
            Reset
          </VSCodeButton>
        </div>
        {viewStyle === 'chat' && <BlocksView blocks={didRun ? blocks : []} />}
        {viewStyle === 'glass' && <GlassView glass={glass} />}
      </div>
      <ComposerView
        send={values => {
          setDidRun(true)
          send(values)
        }}
        variables={variables}
      />
    </div>
  )
}
