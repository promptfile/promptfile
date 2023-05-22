export function useState(initValue: any, currState: any, stateKey: any) {
  if (currState[stateKey] !== undefined) {
    return [
      currState[stateKey],
      (newValue: any) => {
        currState[stateKey] = newValue
      },
    ]
  }
  // set state to initial value
  currState[stateKey] = initValue
  return [
    initValue,
    (newValue: any) => {
      currState[stateKey] = newValue
    },
  ]
}
