export function parseInterpolations(str: string) {
  const stack = []
  let matchStart = -1
  const matches: string[] = []

  for (let i = 0; i < str.length; i++) {
    if (str.substr(i, 2) === '@{') {
      if (stack.length === 0) {
        matchStart = i
      }
      stack.push('{')
      i++ // skip the second character of '${'
    } else if (str[i] === '{') {
      stack.push('{')
    } else if (str[i] === '}') {
      stack.pop()
      if (stack.length === 0 && matchStart >= 0) {
        matches.push(str.slice(matchStart, i + 1)) // save the matched sequence
        matchStart = -1 // reset match start position
      }
    }
  }

  return matches
}
