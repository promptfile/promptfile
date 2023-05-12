export function interpolate(template: string, variables: Record<string, string>, prefix?: string) {
  let interpolatedBlock = template
  for (const key of Object.keys(variables)) {
    const isInt = !isNaN(parseInt(key))
    const value = variables[key]
    const regex = isInt
      ? new RegExp(`\\$\\{${key}\\}`, 'g')
      : new RegExp(`\\$\\{${prefix ? prefix + '.' : ''}${key}\\}`, 'g')
    interpolatedBlock = interpolatedBlock.replace(regex, value)
  }
  return interpolatedBlock
}
