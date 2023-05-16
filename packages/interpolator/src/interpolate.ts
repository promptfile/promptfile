export function interpolate(template: string, variables: Record<string, string>) {
  let interpolatedBlock = interpolateJSXExpressions(template, variables)

  const nonJsxInterpolations = Object.keys(variables).filter(key => !key.startsWith('jsx-'))

  for (const key of nonJsxInterpolations) {
    const value = variables[key]
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
    interpolatedBlock = interpolatedBlock.replace(regex, value)
  }
  return interpolatedBlock
}

export function interpolateJSXExpressions(template: string, variables: Record<string, string>) {
  let interpolated = template

  // first interpolate the jsx interpolations
  while (true) {
    const match = interpolated.match(/(\${(jsx-[0-9]*)})/g)
    if (match == null) {
      break
    }

    for (const m of match) {
      const value = variables[m.slice(2).slice(0, -1)]
      interpolated = interpolated.replace(m, value)
    }
  }

  return interpolated
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
