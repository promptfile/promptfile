import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'
import { GlassBlock } from './rig'

interface ChatViewProps {
  glass: string
  blocks: GlassBlock[]
  variables: string[]
  postMessage: (action: string, data?: any) => void
}

export const ChatView = (props: ChatViewProps) => {
  const { glass, postMessage, blocks, variables } = props

  const [values, setValues] = useState<Record<string, string>>({})

  const send = () => {
    postMessage('runPlayground', {
      glass,
      values,
    })
  }

  useEffect(() => {
    const element = document.getElementById(`end`)
    if (element) {
      element.scrollIntoView({ behavior: 'auto' })
    }
  }, [blocks.length])

  useEffect(() => {
    const newValues = Object.fromEntries((variables as string[]).map(variable => [variable, values.variable ?? '']))
    setValues(() => newValues)
  }, [variables])

  return (
    <div style={{ overflow: 'hidden', height: '100%', flexDirection: 'column', display: 'flex' }}>
      <div
        style={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          overflowY: 'scroll',
          overflowX: 'hidden',
          height: '100%',
        }}
      >
        <div style={{ width: '100%', height: '16px' }} />
        {blocks.map((block, index) => (
          <span
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '24px',
              paddingLeft: '24px',
              paddingRight: '24px',
            }}
          >
            <span style={{ fontWeight: 'bold', opacity: 0.5, fontSize: '12px', paddingBottom: '4px' }}>
              {block.tag}
            </span>
            <span style={{ whiteSpace: 'pre-line' }}>{block.content}</span>
          </span>
        ))}
        <div id={'end'} style={{ width: '100%', height: '0px' }} />
      </div>
      <div style={{ width: '100%', flexShrink: 0 }}>
        <VSCodeDivider style={{ margin: 0, padding: 0 }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingRight: '8px',
            }}
          >
            {Object.keys(values).map((variable, index) => (
              <VSCodeTextArea
                key={variable}
                style={{ width: '100%' }}
                value={values[variable] ?? ''}
                id={`composer-input-${index}`}
                placeholder={variable}
                onInput={e => {
                  const value = (e.target as any).value
                  setValues({ ...values, [variable]: value })
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
            ))}
          </div>
          <VSCodeButton style={{ width: 'fit-content' }} onClick={() => send()}>
            Run
          </VSCodeButton>
        </div>
      </div>
    </div>
  )
}
