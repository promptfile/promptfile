export function checkOk(val: unknown, msg?: string): asserts val {
  if (!Boolean(val)) {
    throw new Error(msg || `expected truthy value but got ${val}`)
  }
}
