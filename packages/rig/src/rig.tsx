import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeDropdown,
  VSCodeOption,
  VSCodePanelTab,
  VSCodePanelView,
  VSCodePanels,
  VSCodeTextArea,
  VSCodeTextField,
} from '@vscode/webview-ui-toolkit/react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { render } from 'react-dom'

interface State {
  currFilename: string
  isChat: boolean // whether the current file is af chat file
  currVariableValues: Record<string, string>
  result: string
  currVariables: string[]
  model: string
  logs: Log[]
}

interface Log {
  file: string
  args: Record<string, string>
  model: string
  prompt: string | { role: string; content: string }[]
  isChat: boolean
  result?: string
}

const vscode = acquireVsCodeApi<State>()

const container = document.getElementById('root')

render(<MyComponent />, container)

function MyComponent() {
  const chatModels = useMemo(() => ['gpt-3.5-turbo', 'gpt-4'], [])
  const completionModels = useMemo(() => ['text-davinci-003', 'text-curie-001', 'text-babbage-001', 'text-ada-001'], [])

  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiKeyIsFromConfig, setOpenaiKeyIsFromConfig] = useState(false)

  const initialState = vscode.getState() || {
    currFilename: '',
    isChat: true,
    currVariableValues: {},
    result: '',
    currVariables: [],
    model: chatModels[0],
    logs: [],
  }

  const [currFilename, setCurrFilename] = useState(initialState.currFilename || '')
  const [currVariables, setCurrVariables] = useState(initialState.currVariables || [])
  const [isChat, setIsChat] = useState(initialState.isChat ?? true)
  const [currVariableValues, setCurrVariableValues] = useState(initialState.currVariableValues || {})
  const [result, setResult] = useState(initialState.result || '')
  const [model, setModel] = useState(initialState.model || chatModels[0])
  const [logs, setLogs] = useState(initialState.logs || [])

  // when React state changes, persist to vscode state
  useEffect(() => {
    vscode.setState({ currFilename, isChat, currVariableValues, result, currVariables, model, logs })
  }, [currFilename, isChat, currVariableValues, result, model, currVariables, logs])

  // when the webview loads, send a message to the extension to get the openai key
  useEffect(() => {
    vscode.postMessage({
      action: 'getOpenaiKey',
    })
  }, [])

  // register a callback for when the extension sends a message
  useEffect(() => {
    // when new chat streaming data comes in, update the result with the content delta
    function processCompletionStream(currResult: string, eventData: { choices: { text: string }[] }) {
      if (eventData.choices[0].text) {
        const newResult = currResult + eventData.choices[0].text
        setResult(newResult)
        return newResult
      }
      return currResult
    }

    function processChatStream(currResult: string, eventData: { choices: { delta: { content: string } }[] }) {
      if (eventData.choices[0].delta.content) {
        const newResult = currResult + eventData.choices[0].delta.content
        setResult(newResult)
        return newResult
      }
      return currResult
    }

    async function handleStreamResponse(r: Response, processCb: (currResult: string, eventData: any) => string) {
      if (!r.ok) {
        throw new Error(`HTTP error: ${r.status}`)
      }

      if (r.headers.get('content-type') !== 'text/event-stream') {
        throw new Error(`Expected "text/event-stream" content type, but received "${r.headers.get('content-type')}"`)
      }

      const reader = r.body!.getReader()
      const decoder = new TextDecoder()

      let fullResult = ''

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
            fullResult = processCb(fullResult, eventData)
          }
        }

        // Continue reading the stream
        await readStream()
      }

      // Start reading the stream
      try {
        await readStream()
        return fullResult
      } catch (e: any) {
        setIsError(true)
        setResult(e.message)
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchCompletion(prompt: string, args: any, file: string) {
      const logIndex = logs.length
      const log: Log = {
        isChat: false,
        file,
        args,
        model,
        prompt,
      }

      const initLogs = [...logs, log]
      setLogs(initLogs)

      const r = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          stream: true,
        }),
      })
      const response = await handleStreamResponse(r, processCompletionStream)

      const newLogs = [...initLogs]
      newLogs[logIndex].result = response
      setLogs(newLogs)
    }

    async function fetchChatCompletion(messages: any, args: any, file: string) {
      const logIndex = logs.length
      const log: Log = {
        isChat: true,
        file,
        args,
        model,
        prompt: messages,
      }

      const initLogs = [...logs, log]
      setLogs(initLogs)

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          stream: true,
        }),
      })
      const response = await handleStreamResponse(r, processChatStream)

      const newLogs = [...initLogs]
      newLogs[logIndex].result = response
      setLogs(newLogs)
    }

    const cb = async (event: any) => {
      const message = event.data // The JSON data our extension sent

      switch (message.action) {
        case 'setOpenaiKey':
          const key = message.data
          setOpenaiKey(key)
          if (key) {
            setOpenaiKeyIsFromConfig(true)
          }
          break

        case 'updateDocumentMetadata':
          const metadata = message.data
          setCurrVariables(() => metadata.interpolationVariables)
          setIsChat(() => metadata.isChat)
          setCurrFilename(() => metadata.filename)
          if (metadata.isChat && !chatModels.includes(model)) {
            setModel(() => chatModels[0])
          } else if (!metadata.isChat && !completionModels.includes(model)) {
            setModel(() => completionModels[0])
          }
          break

        case 'execFileOutput':
          const { prompt, args, file } = message.data

          setIsError(false)
          setIsLoading(true)
          setResult('')

          if (prompt instanceof Array) {
            await fetchChatCompletion(prompt, args, file)
          } else {
            await fetchCompletion(prompt, args, file)
          }
          break
      }
    }

    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [chatModels, completionModels, logs, model, openaiKey, result])

  const exec = () => {
    if (openaiKey === '') {
      vscode.postMessage({
        action: 'showMessage',
        data: {
          level: 'error',
          text: 'Please set `glass.openaiKey` in your extension settings.',
        },
      })
      return
    }

    const interpolationVars: any = {}
    for (const variable of currVariables) {
      interpolationVars[variable] = currVariableValues[variable]
    }
    vscode.postMessage({
      action: 'execCurrentFile',
      data: interpolationVars,
    })
  }

  const reset = () => {
    setCurrVariableValues({})
    setResult('')
  }

  const textColor = isError ? '#F44747' : '#007ACC'

  const modelSelection = isChat ? chatModels : completionModels

  return (
    <div style={{ flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingBottom: '4px' }}>
        <svg
          style={{ opacity: 0.3 }}
          width="24"
          height="24"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <mask id="path-1-inside-1_2_11" fill="white">
            <rect width="120" height="120" rx="3" />
          </mask>
          <rect width="120" height="120" rx="3" stroke="white" stroke-width="24" mask="url(#path-1-inside-1_2_11)" />
          <line x1="94.2565" y1="83.8838" x2="72.694" y2="106.384" stroke="white" stroke-width="4" />
          <line x1="116.796" y1="47.2793" x2="98.9831" y2="66.9668" stroke="white" stroke-width="4" />
          <line x1="23.0065" y1="67.0088" x2="1.44398" y2="89.5088" stroke="white" stroke-width="4" />
          <line x1="78.319" y1="44.5088" x2="56.7565" y2="67.0088" stroke="white" stroke-width="4" />
          <line x1="39.8815" y1="89.5088" x2="18.319" y2="112.009" stroke="white" stroke-width="4" />
          <line x1="56.7991" y1="10.7129" x2="39.9241" y2="29.4629" stroke="white" stroke-width="4" />
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>
          {currFilename.split('.glass')[0]}
          <span style={{ opacity: 0.3, color: 'white', fontStyle: 'italic' }}>.glass</span>
        </span>
      </div>
      {!openaiKeyIsFromConfig ? (
        <div style={{ paddingTop: '16px' }}>
          <div style={{ paddingBottom: '16px' }}>
            The Glass playground requires an OpenAI API key to function. Please enter one below.
          </div>
          <VSCodeTextField
            style={{ width: '100%', paddingBottom: '8px' }}
            value={openaiKey}
            placeholder="sk-..."
            onInput={e => {
              const value = (e.target as any).value
              setOpenaiKey(value)
            }}
          />

          <VSCodeButton style={{ width: '100%' }}>Save API key</VSCodeButton>
          <div style={{ opacity: 0.5, paddingTop: '32px' }}>
            Note: Glass does not store or access this key remotely — it exists only in your VSCode settings as{' '}
            <span style={{ fontFamily: 'monospace' }}>glass.openaiKey</span>.
          </div>
        </div>
      ) : (
        <VSCodePanels>
          <VSCodePanelTab id="tab1">Playground</VSCodePanelTab>
          <VSCodePanelTab id="tab2">Logs</VSCodePanelTab>
          <VSCodePanelTab id="tab3">Config</VSCodePanelTab>
          <VSCodePanelView style={{ flexDirection: 'column', minHeight: '300px' }}>
            <div style={{ paddingBottom: '8px' }}>
              <div style={{ paddingBottom: '4px' }}>Model</div>
              <VSCodeDropdown
                id="model-dropdown"
                onChange={e => {
                  const value = (e.target as any).value
                  setModel(value)
                }}
              >
                {modelSelection.map(m => (
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

          {/* Logs */}
          <VSCodePanelView style={{ flexDirection: 'column', minHeight: '300px' }}>
            {logs.length === 0 && <span>No requests</span>}
            {logs
              .map((log, i) => (
                <Fragment key={i}>
                  <div>
                    <div style={{ paddingBottom: '14px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', opacity: '0.8', fontStyle: 'italic' }}>
                        {log.file}
                      </span>
                    </div>
                    <div style={{ paddingBottom: '8px' }}>
                      <div style={{ paddingBottom: '4px' }}>Model</div>
                      <VSCodeDropdown disabled={true}>
                        <VSCodeOption value={log.model} selected={true}>
                          {log.model}
                        </VSCodeOption>
                      </VSCodeDropdown>
                    </div>
                    {Object.keys(log.args).map((v, k) => (
                      <div key={k} style={{ paddingBottom: '8px' }}>
                        <div style={{ paddingBottom: '4px' }}>{v}</div>
                        <VSCodeTextArea style={{ width: '100%' }} value={log.args[v] || ''} readOnly={true} />
                      </div>
                    ))}
                    <div style={{ paddingBottom: '8px', paddingTop: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>Prompt</div>
                      <VSCodePanels>
                        <VSCodePanelTab id={`logprompt${i}`}>glass</VSCodePanelTab>
                        <VSCodePanelTab id={`lograw${i}`}>json</VSCodePanelTab>
                        <VSCodePanelView>
                          <VSCodeTextArea
                            resize={'vertical'}
                            rows={10}
                            style={{ width: '100%' }}
                            value={
                              log.isChat
                                ? (log.prompt as any)
                                    .map((block: { role: string; content: string }) => {
                                      const tagName = block.role[0].toUpperCase() + block.role.slice(1)
                                      return `<${tagName}>\n${block.content}\n</${tagName}>`
                                    })
                                    .join('\n\n')
                                : `<Prompt>\n${log.prompt}\n</Prompt>`
                            }
                            readOnly={true}
                          />
                        </VSCodePanelView>
                        <VSCodePanelView>
                          <VSCodeTextArea
                            resize={'vertical'}
                            rows={10}
                            style={{ width: '100%', fontFamily: 'monospace' }}
                            value={JSON.stringify(log.prompt, null, 2)}
                            readOnly={true}
                          />
                        </VSCodePanelView>
                      </VSCodePanels>
                    </div>
                    {log.result != null && (
                      <div style={{ paddingBottom: '8px' }}>
                        <span style={{ color: textColor, paddingTop: '16px', whiteSpace: 'pre-wrap' }}>
                          {log.result}
                        </span>
                      </div>
                    )}
                  </div>
                  <VSCodeDivider />
                </Fragment>
              ))
              .reverse()}
          </VSCodePanelView>
          <VSCodePanelView>Coming soon!</VSCodePanelView>
        </VSCodePanels>
      )}
    </div>
  )
}
