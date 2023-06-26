import { ChatView } from './ChatView'
import { VariablesView } from './VariablesView'
import { ChatBlock } from './rig'

interface SessionViewProps {
  blocks: ChatBlock[]
  theme: string
  runChat: (chatToRun: string) => void
  interpolateVariables: (inputsToRun: Record<string, string>) => void
  stop: () => void
  streaming: boolean
  session: string
  variables: string[]
}

export const SessionView = (props: SessionViewProps) => {
  const { blocks, streaming, runChat, stop, theme, session, variables, interpolateVariables } = props

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {variables.length > 0 ? (
        <VariablesView variables={variables} interpolateVariables={interpolateVariables} />
      ) : (
        <ChatView blocks={blocks} runChat={runChat} session={session} stop={stop} streaming={streaming} theme={theme} />
      )}
    </div>
  )
}
