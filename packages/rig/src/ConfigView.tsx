import { VSCodePanelView } from '@vscode/webview-ui-toolkit/react'
import { RigFile } from './rig'

interface ConfigViewProps {
  file: RigFile
}
export const ConfigView = (props: ConfigViewProps) => {
  const { file } = props

  return <VSCodePanelView>Coming soon!</VSCodePanelView>
}
