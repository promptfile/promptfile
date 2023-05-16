import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { FileView } from './FileView'

export interface RigState {
  store: Record<string, RigFile>
}

export interface RigFile {
  filename: string
  isChat: boolean // whether the current file is a chat file
  values: Record<string, string>
  result: string
  error?: string | null
  variables: string[]
  model: string
  logs: RigLog[]
}

export interface RigLog {
  file: string
  args: Record<string, string>
  model: string
  prompt: string | { role: string; content: string }[]
  isChat: boolean
  result?: string
  error?: string
}

const vscode = acquireVsCodeApi<RigState>()

const container = document.getElementById('root')

render(<RigView />, container)

function RigView() {
  const [initializing, setInitializing] = useState(true)
  const [currFilename, setCurrFilename] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [inputKey, setInputKey] = useState('')

  // when the webview loads, send a message to the extension to get the openai key
  useEffect(() => {
    vscode.postMessage({
      action: 'getOpenaiKey',
    })
  }, [])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent

      switch (message.action) {
        case 'onOpenGlassFile':
          setCurrFilename(() => message.data.filename)
          break
        case 'setOpenaiKey':
          const key = message.data
          setOpenaiKey(key)
          setInitializing(false)
          break
        default:
          break
      }
    }

    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [openaiKey])

  const saveKey = () => {
    const trimmedKey = inputKey.trim()
    if (!trimmedKey.startsWith('sk-')) {
      vscode.postMessage({
        action: 'showMessage',
        data: {
          level: 'error',
          text: '',
        },
      })
      return
    }
    vscode.postMessage({
      action: 'saveOpenaiKey',
      data: {
        key: trimmedKey,
      },
    })
  }

  const currFile = currFilename
    ? vscode.getState()?.store?.[currFilename] ?? {
        filename: currFilename,
        isChat: true,
        values: {},
        logs: [],
        model: 'gpt-3.5-turbo',
        result: '',
        variables: [],
      }
    : null

  return !initializing && openaiKey.length === 0 ? (
    <div style={{ paddingTop: '16px' }}>
      <div style={{ paddingBottom: '16px' }}>
        The Glass playground requires an OpenAI API key to function. Please enter one below.
      </div>
      <VSCodeTextField
        style={{ width: '100%', paddingBottom: '8px' }}
        value={inputKey}
        placeholder="sk-..."
        onInput={e => {
          const value = (e.target as any).value
          setInputKey(value)
        }}
      />

      <VSCodeButton style={{ width: '100%' }} onClick={() => saveKey()}>
        Save API key
      </VSCodeButton>
      <div style={{ opacity: 0.5, paddingTop: '32px' }}>
        Note: Glass does not store or access this key remotely — it exists only in your VSCode settings as{' '}
        <span style={{ fontFamily: 'monospace' }}>glass.openaiKey</span>.
      </div>
    </div>
  ) : currFile ? (
    <FileView
      key={currFilename}
      openaiKey={openaiKey}
      file={currFile}
      postMessage={(action: string, data: any) => vscode.postMessage({ action, data })}
      saveFileInStorage={(updatedFile: RigFile) => {
        const currentState = vscode.getState()
        vscode.setState({
          store: {
            ...(currentState?.store ?? {}),
            [currFilename]: updatedFile,
          },
        })
      }}
    />
  ) : (
    <span>Open a Glass file to get started.</span>
  )
}
