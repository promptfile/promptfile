import {
  VSCodeDivider,
  VSCodeDropdown,
  VSCodeOption,
  VSCodePanelTab,
  VSCodePanelView,
  VSCodePanels,
  VSCodeTextArea,
} from '@vscode/webview-ui-toolkit/react'
import { Fragment } from 'react'
import { RigLog } from './rig'

interface LogsViewProps {
  logs: RigLog[]
}

export const LogsView = (props: LogsViewProps) => {
  const { logs } = props

  return (
    <VSCodePanelView style={{ flexDirection: 'column', minHeight: '300px' }}>
      {logs.length === 0 && <span>No requests</span>}
      {logs
        .map((log, i) => (
          <Fragment key={i}>
            <div>
              <div style={{ paddingBottom: '8px' }}>
                <div style={{ paddingBottom: '4px' }}>Model</div>
                <VSCodeDropdown disabled={true}>
                  <VSCodeOption value={log.model} selected={true}>
                    {log.model}
                  </VSCodeOption>
                </VSCodeDropdown>
              </div>
              {Object.keys(log.args.variables).map((v, k) => (
                <div key={k} style={{ paddingBottom: '8px' }}>
                  <div style={{ paddingBottom: '4px' }}>{v}</div>
                  <VSCodeTextArea style={{ width: '100%' }} value={log.args.variables[v] || ''} readOnly={true} />
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
              {(log.error || log.result) && (
                <div style={{ paddingBottom: '8px' }}>
                  <span
                    style={{ color: log.error ? '#F44747' : '#007ACC', paddingTop: '16px', whiteSpace: 'pre-wrap' }}
                  >
                    {log.error ?? log.result}
                  </span>
                </div>
              )}
            </div>
            <VSCodeDivider />
          </Fragment>
        ))
        .reverse()}
    </VSCodePanelView>
  )
}
