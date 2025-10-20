import { formatLargeNumber } from '../../../shared/formatting/number-scale';
export { formatLargeNumber };

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