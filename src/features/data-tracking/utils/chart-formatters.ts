// Format large numbers for Y-axis (like 100B, 1.5T, etc.)
export function formatLargeNumber(value: number): string {
  if (value >= 1e15) {
    return `${(value / 1e15).toFixed(1)}Q`
  } else if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`
  }
  return value.toString()
}

// Generate nice Y-axis ticks for large numbers
export function generateYAxisTicks(maxValue: number): number[] {
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const normalizedMax = maxValue / magnitude

  let step: number
  if (normalizedMax <= 2) {
    step = 0.5 * magnitude
  } else if (normalizedMax <= 5) {
    step = 1 * magnitude
  } else {
    step = 2 * magnitude
  }

  const ticks: number[] = []
  for (let i = 0; i <= Math.ceil(maxValue / step); i++) {
    ticks.push(i * step)
  }

  return ticks
}