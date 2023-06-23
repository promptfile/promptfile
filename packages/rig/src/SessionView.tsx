import { GlassContent } from '@glass-lang/glasslib'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialOceanic } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { CopyButton } from './CopyButton'

interface SessionViewProps {
  blocks: GlassContent[]
  session: string
}

export const SessionView = (props: SessionViewProps) => {
  const { blocks, session } = props
  const sessionId = session.split('/').pop()
  const [autoScroll, setAutoScroll] = useState(true)
  const chatContainer = useRef<HTMLDivElement | null>(null)

  const CodeBlock = ({ language, value }: { language: string; value: string }) => {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '12px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ opacity: 0.5 }}>{language}</div>
          <CopyButton value={value} />
        </div>
        <SyntaxHighlighter language={language} style={materialOceanic} wrapLongLines>
          {value}
        </SyntaxHighlighter>
      </div>
    )
  }

  const colorLookup: Record<string, string> = {
    User: '#5EC5E5',
    Assistant: '#4EC9B0',
    System: '#f467c6',
  }

  const handleScroll = () => {
    if (!chatContainer.current) return

    const { scrollTop, scrollHeight, clientHeight } = chatContainer.current
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5

    setAutoScroll(atBottom)
  }

  useEffect(() => {
    // Attach the scroll event handler
    const current = chatContainer.current
    chatContainer.current?.addEventListener('scroll', handleScroll)

    // Detach the handler when the component unmounts
    return () => {
      current?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Only scroll automatically if the user is at the bottom of the chat
    if (autoScroll) {
      document.getElementById('end')?.scrollIntoView()
    }
  }, [blocks, autoScroll])

  function modelName(block: GlassContent): string | undefined {
    const modelAttr = block.attrs?.find(attr => attr.name === 'model')
    if (block.tag !== 'Assistant' || !modelAttr) {
      return undefined
    }
    return modelAttr.stringValue
  }

  function requestSummary(block: GlassContent): string | undefined {
    const requestTokens = block.attrs?.find(attr => attr.name === 'requestTokens')
    const temperature = block.attrs?.find(attr => attr.name === 'temperature')
    if (block.tag !== 'Assistant' || !requestTokens || !temperature) {
      return undefined
    }
    return `Request: ${requestTokens.expressionValue} tokens (temperature: ${temperature.expressionValue})`
  }

  function responseSummary(block: GlassContent): string | undefined {
    const responseTokens = block.attrs?.find(attr => attr.name === 'responseTokens')
    const cost = block.attrs?.find(attr => attr.name === 'cost')
    if (block.tag !== 'Assistant' || !responseTokens || !cost) {
      return undefined
    }
    return `Response: ${responseTokens.expressionValue} tokens (${cost.stringValue})`
  }
  return (
    <div
      ref={chatContainer}
      style={{
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      <div
        style={{
          paddingTop: '16px',
          paddingBottom: '16px',
          fontFamily: 'monospace',
          fontSize: '10px',
          opacity: 0.3,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {sessionId}
      </div>
      {blocks.map((block, index) => {
        const model = modelName(block)
        const request = requestSummary(block)
        const response = responseSummary(block)
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '48px',
              fontStyle: block.tag === 'System' ? 'italic' : 'normal',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontWeight: 'bold',
                  color: block.tag ? colorLookup[block.tag] : undefined,
                  fontStyle: 'italic',
                  fontSize: '12px',
                }}
              >
                {block.tag}
              </span>
              {model && <span style={{ fontFamily: 'monospace', opacity: 0.5, fontSize: '10px' }}>{model}</span>}
            </div>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeMathjax]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} {...props} />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                table({ children }) {
                  return (
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        border: '1px solid black',
                        padding: '1rem 0.75rem',
                        // Consider using a dark mode library to handle dark mode styles
                      }}
                    >
                      {children}
                    </table>
                  )
                },
                th({ children }) {
                  return (
                    <th
                      style={{
                        // wordBreak: 'break-word',
                        border: '1px solid black',
                        backgroundColor: 'gray',
                        padding: '1rem 0.75rem',
                        color: 'white',
                        // Consider using a dark mode library to handle dark mode styles
                      }}
                    >
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return (
                    <td
                      style={{
                        // wordBreak: 'break-word',
                        border: '1px solid black',
                        padding: '1rem 0.75rem',
                        // Consider using a dark mode library to handle dark mode styles
                      }}
                    >
                      {children}
                    </td>
                  )
                },
              }}
            >
              {block.child?.content ?? ''}
            </ReactMarkdown>
            <div style={{ fontSize: '10px', opacity: 0.3, display: 'flex', flexDirection: 'column' }}>
              {request && <span>{request}</span>}
              {response && <span>{response}</span>}
            </div>
          </div>
        )
      })}
      <div id={'end'} style={{ width: '100%', height: '0px' }} />
    </div>
  )
}
