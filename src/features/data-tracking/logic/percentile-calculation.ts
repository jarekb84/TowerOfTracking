/**
 * Pure functions for percentile calculations
 * Used in tier statistics aggregation
 */

/**
 * Calculates the percentile value from a sorted array of numbers
 * @param sortedValues - Array of numbers sorted in ascending order
 * @param percentile - Percentile to calculate (0-1, e.g., 0.99 for P99)
 * @returns The value at the specified percentile, or null if insufficient data
 */
export function calculatePercentile(
  sortedValues: number[],
  percentile: number
): number | null {
  if (sortedValues.length === 0) {
    return null
  }

  if (sortedValues.length === 1) {
    return sortedValues[0]
  }

  const index = Math.floor(percentile * sortedValues.length)
  const clampedIndex = Math.min(index, sortedValues.length - 1)

  return sortedValues[clampedIndex]
}

/**
 * Result of batch percentile calculation
 */
export interface PercentileResults {
  p99: number | null
  p90: number | null
  p75: number | null
  p50: number | null
}

/**
 * Efficiently calculates all percentiles with a single sort operation
 * This is the PREFERRED method when you need multiple percentiles from the same dataset
 *
 * @param values - Array of numbers (unsorted)
 * @returns Object containing all percentile values
 */
export function calculateAllPercentiles(values: number[]): PercentileResults {
  if (values.length === 0) {
    return { p99: null, p90: null, p75: null, p50: null }
  }

  // Single sort operation for all percentiles
  const sorted = [...values].sort((a, b) => a - b)

  return {
    p99: calculatePercentile(sorted, 0.99),
    p90: calculatePercentile(sorted, 0.90),
    p75: calculatePercentile(sorted, 0.75),
    p50: calculatePercentile(sorted, 0.50),
  }
}

/**
 * Calculates the 99th percentile (P99) value
 * NOTE: If you need multiple percentiles, use calculateAllPercentiles() instead for better performance
 *
 * @param values - Array of numbers (will be sorted internally)
 * @returns The P99 value, or null if insufficient data
 */
export function calculateP99(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return calculatePercentile(sorted, 0.99)
}

/**
 * Calculates the 90th percentile (P90) value
 * NOTE: If you need multiple percentiles, use calculateAllPercentiles() instead for better performance
 *
 * @param values - Array of numbers (will be sorted internally)
 * @returns The P90 value, or null if insufficient data
 */
export function calculateP90(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return calculatePercentile(sorted, 0.90)
}

/**
 * Calculates the 75th percentile (P75) value
 * NOTE: If you need multiple percentiles, use calculateAllPercentiles() instead for better performance
 *
 * @param values - Array of numbers (will be sorted internally)
 * @returns The P75 value, or null if insufficient data
 */
export function calculateP75(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return calculatePercentile(sorted, 0.75)
}

/**
 * Calculates the median (P50) value
 * NOTE: If you need multiple percentiles, use calculateAllPercentiles() instead for better performance
 *
 * @param values - Array of numbers (will be sorted internally)
 * @returns The median value, or null if insufficient data
 */
export function calculateP50(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return calculatePercentile(sorted, 0.50)
}
