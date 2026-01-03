import type { ChartDataPoint } from '../chart-types'

/**
 * Calculate period-over-period percentage change for chart data points.
 *
 * Formula: (currentValue - previousValue) / |previousValue| * 100
 *
 * @param dataPoints - Array of chart data points with values
 * @returns New array with percentChange property added to each point
 *
 * @remarks
 * - First data point is always 0% (no prior period)
 * - Division by zero is handled: if previousValue is 0 and current > 0, returns 100%
 * - If both are 0, returns 0%
 */
export function calculatePercentChange(
  dataPoints: ChartDataPoint[]
): ChartDataPoint[] {
  return dataPoints.map((point, index) => ({
    ...point,
    percentChange:
      index === 0
        ? 0 // First point has no prior period to compare
        : calculatePointPercentChange(dataPoints[index - 1].value, point.value),
  }))
}

/**
 * Calculate percentage change between two values.
 * Extracted for clarity and testing.
 */
function calculatePointPercentChange(
  previousValue: number,
  currentValue: number
): number {
  if (previousValue === 0) {
    // Handle division by zero
    return currentValue > 0 ? 100 : currentValue < 0 ? -100 : 0
  }
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100
}
