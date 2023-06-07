export function generateULID(): string {
  const epochBase = 1469918176397
  const now = Date.now()
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

  let ts = (now - epochBase).toString(32).toUpperCase()
  while (ts.length < 10) {
    ts = '0' + ts
  }

  let randomPart = ''
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    randomPart += chars[randomIndex]
  }

  return `A` + ts + randomPart
}
