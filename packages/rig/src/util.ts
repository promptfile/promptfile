export function getNonce(length = 8) {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export function firstElement(array: any[]) {
  return array.length > 0 ? array[0] : undefined
}
export function lastElement(array: any[]) {
  return array.length > 0 ? array[array.length - 1] : undefined
}
