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
  }
  const [currVariables, setCurrVariables] = useState(initialState?.currVariables || [])
  const [currVariableValues, setCurrVariableValues] = useState(initialState?.currVariableValues || {})
  const [result, setResult] = useState(initialState?.result || '')
  const [model, setModel] = useState(initialState?.model || allModels[0])

  useEffect(() => {
    vscode.setState({ currVariableValues, result, currVariables, model })
  }, [currVariableValues, result, model, currVariables])

  const processEvent = useCallback(
    (eventData: { choices: { delta: { content: string } }[] }) => {
      if (eventData.choices[0].delta.content) {
        setResult(res => res + eventData.choices[0].delta.content)
      }
    },
    [result]
  )

  useEffect(() => {
    vscode.postMessage({
      action: 'GET_OPENAI_KEY',
    })
  }, [])

  useEffect(() => {
    const cb = (event: any) => {
      console.log('got a message', JSON.stringify(event))
      const message = event.data // The JSON data our extension sent
      switch (message.command) {
        case 'updateOpenaiKey':
          const key = message.data
          setOpenaiKey(() => key)
          break
        case 'updateInterpolationVariables':
          console.log('got update interpolation variables', message.data)
          const removedRepeats = message.data.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
          setCurrVariables(() => removedRepeats) // filter away empty variables
          break
        case 'messageFromExtension':
          console.log(`Received message from extension: ${message.data}`)
          console.log('openaiKey: ', openaiKey)
          if (openaiKey === '') {
            setIsError(true)
            setResult('no openai key set — please set it in the extension settings')
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

              // Process received events

              // Read data from the stream
              const readStream = async () => {
                try {
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
                      processEvent(eventData)
                    }
                  }

                  // Continue reading the stream
                  readStream()
                } catch (error) {
                  console.error('Error reading the stream:', error)
                }
              }

              // Start reading the stream
              readStream()
            })
            .catch(() => {
              setIsError(true)
              setResult('failed')
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
  }, [openaiKey, model, processEvent])

  // const transpiled = transpileGlassFile('foo', {
  //   workspaceFolder: '/Users/me/glassc',
  //   folderPath: '/Users/me/glassc',
  //   fileName: 'foo',
  //   language: 'typescript',
  //   outputDirectory: '/Users/me/glassc/src'
  // })

  // console.log('transpiled is', transpiled)

  const send = () => {
    vscode.postMessage({
      action: 'TRANSPILE_CURRENT_FILE',
      data: currVariableValues,
    })
  }

  const reset = () => {
    setCurrVariableValues({})
    setResult('')
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
                  send()
                }
              }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', paddingTop: '8px', paddingBottom: '8px' }}>
          <VSCodeButton id="run-button" onClick={() => send()}>
            Send
          </VSCodeButton>
          <div style={{ flex: 1 }} />
          {/* <div style={{paddingLeft: '8px'}}> */}
          <VSCodeButton id="reset-button" appearance="secondary" onClick={() => reset()}>
            Reset
          </VSCodeButton>
          {/* </div> */}
        </div>
        <span style={{ color: textColor, paddingTop: '16px', whiteSpace: 'pre-line' }}>
          {result}
          {isLoading && <span style={{ backgroundColor: '#007ACC' }}>A</span>}
        </span>
      </VSCodePanelView>
      <VSCodePanelView>Coming soon</VSCodePanelView>
    </VSCodePanels>
  )
}
