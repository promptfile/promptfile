import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialOceanic } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CopyButton } from './CopyButton'

export const CodeBlock = ({ language, value }: { language: string; value: string }) => {
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
