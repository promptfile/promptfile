import MonacoEditor from '@monaco-editor/react'
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { Resizable } from 're-resizable'
import { useEffect, useRef, useState } from 'react'
import { firstElement } from './util'

interface ComposerViewProps {
  theme: string
  run: (inputsToRun: Record<string, string>, sessionToRun: string) => void
  stop: () => void
  reload: () => void
  streaming: boolean
  inputs: Record<string, string>
  setValue: (key: string, value: string) => void
  session: string
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, setValue, streaming, run, stop, theme, session } = props

  const inputsRef = useRef(inputs)
  const sessionRef = useRef(session)

  const keys: string[] = Object.keys(inputs)
  const firstKey = firstElement(keys)
  const [activeKey, setActiveKey] = useState(firstKey ?? '')

  useEffect(() => {
    if (!keys.includes(activeKey)) {
      setActiveKey(firstElement(keys) ?? '')
    }
  }, [keys])

  useEffect(() => {
    document.getElementById('composer-input-0')?.focus()
  }, [keys.length])

  useEffect(() => {
    inputsRef.current = inputs
    sessionRef.current = session
  }, [inputs, session])

  function mapVSCodeThemeToMonaco(theme: string) {
    const themeMapping: Record<string, string> = {
      'Default Dark Modern': 'vs-dark',
      'Default Light Modern': 'vs',
      'Default Dark+': 'vs-dark',
      'Default Light+': 'vs',
      Monokai: 'monokai',
      'Solarized Dark': 'solarized-dark',
      'Solarized Light': 'solarized-light',
    }
    if (themeMapping[theme]) {
      return themeMapping[theme]
    }
    return 'vs-dark'
  }

  const [resizing, setResizing] = useState(false)
  const [height, setHeight] = useState(200)
  const [heightOnStart, setHeightOnStart] = useState(200)

  const disabled = !Object.values(inputs).some(v => v.trim().length > 0)

  console.log(keys)

  return (
    <Resizable
      enable={{
        top: true,
      }}
      minHeight={'80px'}
      maxHeight={'50vh'}
      handleComponent={{
        top: (
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: resizing ? 'blue' : 'transparent',
              cursor: 'row-resize',
            }}
          />
        ),
      }}
      size={{ width: '100%', height: `${height}px` }}
      onResizeStart={() => {
        setResizing(true)
        setHeightOnStart(height)
      }}
      onResize={(e, direction, ref, d) => {
        const newValue = heightOnStart + d.height
        setHeight(newValue)
      }}
      onResizeStop={(e, direction, ref, d) => {
        setResizing(false)
        setHeightOnStart(height)
      }}
    >
      <div style={{ width: '100%', flexShrink: 0 }}>
        <VSCodeDivider style={{ margin: 0, padding: 0 }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {keys.length > 0 && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', paddingLeft: '8px' }}>
                {keys.map(key => {
                  const isCurrentTab = key === activeKey
                  const opacity = isCurrentTab ? 1 : 0.5
                  const color = isCurrentTab ? 'white' : undefined
                  const borderBottomColor = isCurrentTab ? 'white' : 'transparent'
                  return (
                    <div style={{ paddingRight: '24px' }} key={key}>
                      <div
                        style={{
                          opacity,
                          color,
                          borderBottomStyle: 'solid',
                          borderBottomWidth: '2px',
                          borderBottomColor,
                          fontSize: '12px',
                          cursor: 'pointer',
                          paddingBottom: '4px',
                          paddingTop: '4px',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                        }}
                        onClick={() => setActiveKey(key)}
                        onMouseEnter={(event: any) => {
                          event.target.style.opacity = '1.0'
                        }}
                        onMouseLeave={(event: any) => {
                          event.target.style.opacity = opacity
                        }}
                      >
                        {key}
                      </div>
                    </div>
                  )
                })}
              </div>
              {activeKey.length > 0 && (
                <MonacoEditor
                  key={activeKey}
                  width="100%"
                  height={`${height - 50}px`}
                  theme={mapVSCodeThemeToMonaco(theme)}
                  language={'markdown'}
                  value={inputs[activeKey]}
                  onChange={value => setValue(activeKey, value ?? '')}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    padding: {
                      top: 8,
                    },
                    wordWrap: 'on',
                    fontSize: 12,
                    lineDecorationsWidth: 0,
                  }}
                  onMount={(editor, monaco) => {
                    editor.focus()
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                      run(inputsRef.current, sessionRef.current)
                    })
                  }}
                />
              )}
            </div>
          )}
        </div>
        {streaming ? (
          <VSCodeButton style={{ width: '100%' }} appearance="secondary" onClick={stop} disabled={false}>
            Stop
          </VSCodeButton>
        ) : (
          <VSCodeButton
            style={{ width: '100%' }}
            appearance={disabled ? 'secondary' : 'primary'}
            onClick={() => run(inputsRef.current, sessionRef.current)}
            disabled={disabled}
          >
            Run
          </VSCodeButton>
        )}
      </div>
    </Resizable>
  )
}
