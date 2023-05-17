import { VSCodePanelTab, VSCodePanels } from '@vscode/webview-ui-toolkit/react'
import { useEffect, useState } from 'react'
import { FileTopper } from './FileTopper'
import { LogsView } from './LogsView'
import { PlaygroundView } from './PlaygroundView'
import { RigFile, RigLog } from './rig'

interface FileViewProps {
  openaiKey: string
  file: RigFile
  logs: RigLog[]
  saveFileInStorage: (updatedFile: RigFile) => void
  createLogInStorage: (newLog: RigLog) => void
  updateLogInStorage: (updatedLog: RigLog) => void
  postMessage: (action: string, data: any) => void
}

export const FileView = (props: FileViewProps) => {
  const { openaiKey, saveFileInStorage, createLogInStorage, updateLogInStorage, postMessage, logs } = props

  const [file, setFile] = useState(props.file)

  // when React state changes, persist to vscode state
  useEffect(() => {
    saveFileInStorage(file)
  }, [file])

  useEffect(() => {
    setFile(props.file)
  }, [props.file])

  return (
    <div style={{ flexDirection: 'column' }}>
      <FileTopper file={file} />
      <VSCodePanels>
        <VSCodePanelTab id="tab1">Playground</VSCodePanelTab>
        <VSCodePanelTab id="tab2">Logs</VSCodePanelTab>
        {/* <VSCodePanelTab id="tab3">Env</VSCodePanelTab> */}
        <PlaygroundView
          postMessage={postMessage}
          file={file}
          setFile={setFile}
          openaiKey={openaiKey}
          createLog={createLogInStorage}
          updateLog={updateLogInStorage}
        />
        <LogsView logs={logs} />
        {/* <ConfigView file={file} /> */}
      </VSCodePanels>
    </div>
  )
}
