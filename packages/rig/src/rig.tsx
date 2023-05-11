import {
  VSCodeButton,
  VSCodeDropdown,
  VSCodeOption,
  VSCodePanelTab,
  VSCodePanelView,
  VSCodePanels,
  VSCodeTextArea,
} from '@vscode/webview-ui-toolkit/react'
import { useCallback, useEffect, useState } from 'react'
import { render } from 'react-dom'

interface State {
  currVariableValues: Record<string, string>
  result: string
  currVariables: string[]
  model: string
  history: {
    file: string
    args: Record<string, string>
    model: string
    prompt: string | { role: string; content: string }[]
    result: string
  }[]
}

const vscode = acquireVsCodeApi<State>()

const container = document.getElementById('root')

render(<MyComponent />, container)

function MyComponent() {
  const allModels = ['gpt-3.5-turbo', 'gpt-4']
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openaiKey, setOpenaiKey] = useState('')

  const initialState = vscode.getState() || {
    currVariableValues: {},
    result: '',
    currVariables: [],
    model: allModels[0],
    history: [],
  }

  const [currVariables, setCurrVariables] = useState(initialState?.currVariables || [])
  const [currVariableValues, setCurrVariableValues] = useState(initialState?.currVariableValues || {})
  const [result, setResult] = useState(initialState?.result || '')
  const [model, setModel] = useState(initialState?.model || allModels[0])
  const [history, setHistory] = useState(initialState?.history || [])

  // when React state changes, persist to vscode state
  useEffect(() => {
    vscode.setState({ currVariableValues, result, currVariables, model, history })
  }, [currVariableValues, result, model, currVariables, history])

  // when the webview loads, send a message to the extension to get the openai key
  useEffect(() => {
    vscode.postMessage({
      action: 'getOpenaiKey',
    })
  }, [])

  // when new streaming data comes in, update the result with the content delta
  const processStream = useCallback(
    (eventData: { choices: { delta: { content: string } }[] }) => {
      if (eventData.choices[0].delta.content) {
        setResult(res => res + eventData.choices[0].delta.content)
      }
    },
    [result]
  )

  // register a callback for when the extension sends a message
  useEffect(() => {
    const cb = (event: any) => {
      const message = event.data // The JSON data our extension sent

      switch (message.action) {
        case 'setOpenaiKey':
          const key = message.data
          setOpenaiKey(() => key)
          break

        case 'updateInterpolationVariables':
          const removedRepeats = message.data.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
          setCurrVariables(() => removedRepeats) // filter away empty variables
          break

        case 'execFileOutput':
          if (openaiKey === '') {
            vscode.postMessage({
              action: 'showMessage',
              data: {
                level: 'error',
                text: 'Please set `glass.openaiKey` in your extension settings.',
              },
            })
            break
          }
          setIsError(false)
          setIsLoading(true)
          setResult(() => '')
          fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: message.data,
              model,
              stream: true,
            }),
          })
            .then(r => {
              if (!r.ok) {
                throw new Error(`HTTP error: ${r.status}`)
              }

              if (r.headers.get('content-type') !== 'text/event-stream') {
                throw new Error(
                  `Expected "text/event-stream" content type, but received "${r.headers.get('content-type')}"`
                )
              }

              const reader = r.body!.getReader()
              const decoder = new TextDecoder()

              const readStream = async () => {
                const { done, value } = await reader.read()

                if (done) {
                  console.log('Stream has been closed by the server.')
                  return
                }

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    const content = line.slice('data:'.length).trim()
                    if (content === '[DONE]') {
                      break
                    }
                    const eventData = JSON.parse(content)
                    processStream(eventData)
                  }
                }

                // Continue reading the stream
                await readStream()
              }

              // Start reading the stream
              return readStream()
            })
            .catch((e: any) => {
              setIsError(true)
              setResult(() => e.message)
            })
            .finally(() => {
              setIsLoading(false)
            })

          break
      }
    }

    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [openaiKey, model, processStream])

  const exec = () => {
    vscode.postMessage({
      action: 'execCurrentFile',
      data: currVariableValues,
    })
  }

  const reset = () => {
    setCurrVariableValues({})
    setResult(() => '')
  }

  const textColor = isError ? '#F44747' : '#007ACC'

  return (
    <VSCodePanels>
      <VSCodePanelTab id="tab1">Test</VSCodePanelTab>
      <VSCodePanelTab id="tab2">History</VSCodePanelTab>
      <VSCodePanelView style={{ flexDirection: 'column' }}>
        <div style={{ paddingBottom: '8px' }}>
          <div style={{ paddingBottom: '4px' }}>Model</div>
          <VSCodeDropdown
            id="model-dropdown"
            onChange={e => {
              const value = (e.target as any).value
              setModel(value)
            }}
          >
            {allModels.map(m => (
              <VSCodeOption
                key={m}
                value={m}
                selected={m === model}
                onSelect={() => {
                  setModel(m)
                }}
              >
                {m}
              </VSCodeOption>
            ))}
          </VSCodeDropdown>
        </div>
        {currVariables.map((v, i) => (
          <div key={i} style={{ paddingBottom: '8px' }}>
            <div style={{ paddingBottom: '4px' }}>{v}</div>
            <VSCodeTextArea
              style={{ width: '100%' }}
              value={currVariableValues[v] || ''}
              onInput={e => {
                const value = (e.target as any).value
                console.log('input the value!!!', value)
                setCurrVariableValues(curr => ({ ...curr, [v]: value }))
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.metaKey) {
                  e.currentTarget.blur()
                  exec()
                }
              }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', paddingTop: '8px', paddingBottom: '8px' }}>
          <VSCodeButton id="run-button" onClick={() => exec()}>
            Send
          </VSCodeButton>
          <div style={{ flex: 1 }} />
          <VSCodeButton id="reset-button" appearance="secondary" onClick={() => reset()}>
            Reset
          </VSCodeButton>
        </div>
        <span style={{ color: textColor, paddingTop: '16px', whiteSpace: 'pre-wrap' }}>
          {result}
          {isLoading && <span style={{ backgroundColor: '#007ACC' }}>A</span>}
        </span>
      </VSCodePanelView>
      <VSCodePanelView>Coming soon</VSCodePanelView>
    </VSCodePanels>
  )
}
