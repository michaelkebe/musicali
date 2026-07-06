export function computeBpmFromTaps(taps: number[], multiplier: number): number | null {
  if (taps.length < 4) return null

  const diffs: number[] = []
  for (let i = 1; i < taps.length; i++) {
    diffs.push(taps[i] - taps[i - 1])
  }

  let avg: number
  if (diffs.length >= 4) {
    const sorted = [...diffs].sort((a, b) => a - b)
    const trimmed = sorted.slice(1, -1)
    avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  } else {
    avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
  }

  const calculated = 60000 * multiplier / avg
  if (calculated > 20 && calculated < 400) {
    return Math.round(calculated * 1000) / 1000
  }
  return null
}
