import { ChatView } from './ChatView'
import { FileTopper } from './FileTopper'

interface FileViewProps {
  filename: string
  postMessage: (action: string, data: any) => void
}

export const FileView = (props: FileViewProps) => {
  const { filename, postMessage } = props

  return (
    <div style={{ backgroundColor: 'blue', height: '100%' }}>
      <FileTopper filename={filename} />
      <ChatView filename={filename} postMessage={postMessage} />
    </div>
  )
}
