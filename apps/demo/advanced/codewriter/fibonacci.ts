export function fibonacci(n: number): number {
  if (n <= 0) {
    throw new Error('Invalid input. N should be a positive integer.')
  }

  if (n === 1 || n === 2) {
    return 1
  }

  let fibPrev = 1
  let fibCurrent = 1

  for (let i = 3; i <= n; i++) {
    const fibNext = fibPrev + fibCurrent
    fibPrev = fibCurrent
    fibCurrent = fibNext
  }

  return fibCurrent
}
