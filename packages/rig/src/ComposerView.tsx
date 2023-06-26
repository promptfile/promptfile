import MonacoEditor from '@monaco-editor/react'
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { Resizable } from 're-resizable'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ComposerViewProps {
  theme: string
  runChat: (chat: string) => void
  stop: () => void
  streaming: boolean
}

export const ComposerView = (props: ComposerViewProps) => {
  const { streaming, runChat, stop, theme } = props

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const [chat, setChat] = useState('')

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

  const run = useCallback(() => {
    runChat(chat)
    setChat('')
  }, [chat, runChat])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        run()
      })
    }
  }, [run])

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
        <MonacoEditor
          width="100%"
          height={`${height - 28}px`}
          theme={mapVSCodeThemeToMonaco(theme)}
          language={'markdown'}
          value={chat}
          onChange={value => setChat(value ?? '')}
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
            editorRef.current = editor

            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
              run()
            })
          }}
        />
        {streaming ? (
          <VSCodeButton style={{ width: '100%' }} appearance="secondary" onClick={stop} disabled={false}>
            Stop
          </VSCodeButton>
        ) : (
          <VSCodeButton style={{ width: '100%' }} appearance={'primary'} onClick={run}>
            Run
          </VSCodeButton>
        )}
      </div>
    </Resizable>
  )
}
