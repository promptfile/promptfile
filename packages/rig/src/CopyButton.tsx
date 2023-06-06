import { useState } from 'react'

interface CopyButtonProps {
  value: string
}

export const CopyButton = (props: CopyButtonProps) => {
  const { value } = props

  const [copyStatus, setCopyStatus] = useState('Copy code')

  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopyStatus('Copied!')
        setTimeout(() => setCopyStatus('Copy code'), 2000) // Change back after 2 seconds
      })
      .catch(err => console.error('Could not copy text: ', err))
  }
  return (
    <div
      onMouseEnter={(event: any) => {
        event.target.style.opacity = '1.0'
      }}
      onMouseLeave={(event: any) => {
        event.target.style.opacity = '0.5'
      }}
      style={{ cursor: 'pointer', opacity: 0.5 }}
      onClick={handleCopy}
    >
      {copyStatus}
    </div>
  )
}
