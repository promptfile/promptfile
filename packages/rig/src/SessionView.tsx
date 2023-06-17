import { GlassContent } from '@glass-lang/glasslib'
import { BlocksView } from './BlocksView'
import { ComposerView } from './ComposerView'
import { InputsView } from './InputsView'

interface SessionViewProps {
  blocks: GlassContent[]
  session: string
  theme: string
  run: (inputsToRun: Record<string, string>, sessionToRun: string) => void
  stop: () => void
  streaming: boolean
  inputs: Record<string, string>
  setValue: (key: string, value: string) => void
}

export const SessionView = (props: SessionViewProps) => {
  const { blocks, inputs, setValue, streaming, run, stop, theme, session } = props

  const variables = Object.keys(inputs)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {variables.length > 0 ? (
        <InputsView />
      ) : (
        <>
          <BlocksView blocks={blocks} session={session} />
          <ComposerView
            theme={theme}
            run={run}
            stop={stop}
            streaming={streaming}
            inputs={inputs}
            setValue={setValue}
            session={session}
          />
        </>
      )}
    </div>
  )
}
