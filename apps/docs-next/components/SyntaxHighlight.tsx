// Example from https://beta.reactjs.org/learn

import { useEffect, useState } from 'react'

export function SyntaxHighlight(props: { code: string }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    fetch('/api/highlight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: props.code,
      }),
    })
      .then(res => res.json())
      .then(data => {
        // The `data` object now contains your highlighted code
        console.log(data.highlightedCode)
        setHtml(data.highlightedCode)
      })
      .catch(e => console.error(e))
  }, [props.code])

  if (!html) {
    return <span>{props.code}</span>
  }

  return <pre dangerouslySetInnerHTML={{ __html: html }} />
}
