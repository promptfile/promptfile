import MonacoEditor from '@monaco-editor/react'
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { Resizable } from 're-resizable'
import { useEffect, useRef, useState } from 'react'

interface ComposerViewProps {
  theme: string
  run: (messageText: string | null) => void
  stop: () => void
  streaming: boolean
  session: string
}

export const ComposerView = (props: ComposerViewProps) => {
  const { inputs, streaming, run, stop, theme, session } = props

  const inputsRef = useRef(inputs)
  const sessionRef = useRef(session)

  useEffect(() => {
    document.getElementById('composer-monaco')?.focus()
  }, [])

  useEffect(() => {
    sessionRef.current = session
    inputsRef.current = inputs
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
  const disabled = !Object.values(inputs).some(v => v.trim().length === 0)

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
          <MonacoEditor
            width="100%"
            height={`${height - 50}px`}
            theme={mapVSCodeThemeToMonaco(theme)}
            language={'markdown'}
            value={text}
            onChange={value => setText(value ?? '')}
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
                run(inputsRef.current, sessionRef.current, textRef.current)
              })
            }}
          />
        </div>
        {streaming ? (
          <VSCodeButton style={{ width: '100%' }} appearance="secondary" onClick={stop} disabled={false}>
            Stop
          </VSCodeButton>
        ) : (
          <VSCodeButton
            style={{ width: '100%' }}
            appearance={disabled ? 'secondary' : 'primary'}
            onClick={() => run(inputsRef.current, sessionRef.current, textRef.current)}
            disabled={disabled}
          >
            Run
          </VSCodeButton>
        )}
      </div>
    </Resizable>
  )
}
