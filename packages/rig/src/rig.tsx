import { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { FileView } from './FileView'
import { KeyView } from './KeyView'

export interface RigState {
  parameters: Record<string, RigFile>
  logs: RigLog[]
}

export interface RigFile {
  filename: string
  isChat: boolean // whether the current file is a chat file
  values: Record<string, string>
  result: string
  error?: string | null
  variables: string[]
  model: string
}

export interface RigLog {
  id: string
  filename: string
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

  // when the webview loads, send a message to the extension to get the openai key
  useEffect(() => {
    vscode.postMessage({
      action: 'getOpenaiKey',
    })
    vscode.postMessage({
      action: 'getActiveFile',
    })
  }, [])

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent
      switch (message.action) {
        case 'setActiveFile':
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

  const currFile = currFilename
    ? vscode.getState()?.parameters?.[currFilename] ?? {
        filename: currFilename,
        isChat: true,
        values: {},
        model: 'gpt-3.5-turbo',
        result: '',
        variables: [],
      }
    : null

  const currLogs = currFilename ? (vscode.getState()?.logs ?? []).filter(log => log.filename === currFilename) : []

  return !initializing && openaiKey.length === 0 ? (
    <KeyView vscode={vscode} />
  ) : currFile ? (
    <FileView
      key={currFilename}
      openaiKey={openaiKey}
      file={currFile}
      logs={currLogs}
      postMessage={(action: string, data: any) => vscode.postMessage({ action, data })}
      saveFileInStorage={(updatedFile: RigFile) => {
        const currentState = vscode.getState()
        vscode.setState({
          parameters: {
            ...(currentState?.parameters ?? {}),
            [currFilename]: updatedFile,
          },
          logs: currentState?.logs ?? [],
        })
      }}
      createLogInStorage={newLog => {
        const currentState = vscode.getState()
        vscode.setState({
          parameters: currentState?.parameters ?? {},
          logs: [...(currentState?.logs ?? []), newLog],
        })
      }}
      updateLogInStorage={updatedLog => {
        const currentState = vscode.getState()
        const allLogs = currentState?.logs ?? []
        const index = allLogs.findIndex(log => log.id === updatedLog.id)
        allLogs[index] = updatedLog
      }}
    />
  ) : (
    <span>Open a Glass file to get started.</span>
  )
}
