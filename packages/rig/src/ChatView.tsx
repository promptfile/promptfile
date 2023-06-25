import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialOceanic } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { ComposerView } from './ComposerView'
import { CopyButton } from './CopyButton'
import { ChatBlock } from './rig'

interface ChatViewProps {
  blocks: ChatBlock[]
  theme: string
  runChat: (chatToRun: string, sessionToRun: string) => void
  stop: () => void
  streaming: boolean
  session: string
  chat: string
  setChat: (chat: string) => void
}

export const ChatView = (props: ChatViewProps) => {
  const { blocks, streaming, runChat, stop, theme, session, chat, setChat } = props
  const sessionId = session.split('/').pop()
  const [autoScroll, setAutoScroll] = useState(true)
  const chatContainer = useRef<HTMLDivElement | null>(null)

  const capitalize = (s: string) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

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
    user: '#5EC5E5',
    assistant: '#4EC9B0',
    system: '#f467c6',
    function: '#3EA295',
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

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
        {blocks
          .filter(b => b.content !== `@{input}`)
          .map((block, index) => {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: '48px',
                  fontStyle: block.role === 'system' ? 'italic' : 'normal',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: block.role ? colorLookup[block.role] : undefined,
                      fontStyle: 'italic',
                      fontSize: '12px',
                    }}
                  >
                    {capitalize(block.role)}
                  </span>
                  {/* {model && <span style={{ fontFamily: 'monospace', opacity: 0.5, fontSize: '10px' }}>{model}</span>} */}
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
                  {block.content}
                </ReactMarkdown>
                {/* <div style={{ fontSize: '10px', opacity: 0.3, display: 'flex', flexDirection: 'column' }}>
                {request && <span>{request}</span>}
                {response && <span>{response}</span>}
              </div> */}
              </div>
            )
          })}
        <div id={'end'} style={{ width: '100%', height: '0px' }} />
      </div>
      <ComposerView
        theme={theme}
        runChat={runChat}
        stop={stop}
        streaming={streaming}
        session={session}
        chat={chat}
        setChat={setChat}
      />
    </div>
  )
}
