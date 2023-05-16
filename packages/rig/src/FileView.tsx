import { VSCodePanelTab, VSCodePanels } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'
import { ConfigView } from './ConfigView'
import { FileTopper } from './FileTopper'
import { LogsView } from './LogsView'
import { PlaygroundView } from './PlaygroundView'
import { RigFile } from './rig'

interface FileViewProps {
  openaiKey: string
  file: RigFile
  saveFileInStorage: (updatedFile: RigFile) => void
  postMessage: (action: string, data: any) => void
}

export const FileView = (props: FileViewProps) => {
  const { openaiKey, saveFileInStorage, postMessage } = props

  const [file, setFile] = useState(props.file)

  // when React state changes, persist to vscode state
  useEffect(() => {
    saveFileInStorage(file)
  }, [file])

  return (
    <div style={{ flexDirection: 'column' }}>
      <FileTopper file={file} />
      <VSCodePanels>
        <VSCodePanelTab id="tab1">Playground</VSCodePanelTab>
        <VSCodePanelTab id="tab2">Logs</VSCodePanelTab>
        <VSCodePanelTab id="tab3">Env</VSCodePanelTab>
        <PlaygroundView postMessage={postMessage} file={file} setFile={setFile} openaiKey={openaiKey} />
        <LogsView logs={file.logs} />
        <ConfigView file={file} />
      </VSCodePanels>
    </div>
  )
}
