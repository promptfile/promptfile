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

export function interpolateBlock(fnName: string, template: string, variables: Record<string, string>) {
  if (fnName.endsWith('.glass')) {
    fnName = fnName.slice(0, -'.glass'.length)
  }

  const interpolateBlock = interpolate(template, variables)

  // check that there are no uninterpolated variables
  const uninterpolatedVariables = interpolateBlock.match(/\${([A-Za-z0-9]*)}/g)
  if (uninterpolatedVariables) {
    // TODO: these will show names like "1", "2", etc instead of the actual variable names, since the transpiler rewrites them
    throw new Error(`un-interpolated variables in ${fnName}.glass: ${uninterpolatedVariables.join(', ')}`)
  }

  return interpolateBlock
}
