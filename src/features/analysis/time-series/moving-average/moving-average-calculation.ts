import type { ChartDataPoint } from '../chart-types'

/**
 * Calculate moving average for chart data points
 *
 * A moving average smooths out short-term fluctuations by averaging
 * a rolling window of data points, revealing longer-term trends.
 *
 * @param dataPoints - Array of chart data points with values
 * @param windowSize - Number of points to include in the rolling average (3, 5, or 10)
 * @returns New array with movingAverage property added to each point
 */
export function calculateMovingAverage(
  dataPoints: ChartDataPoint[],
  windowSize: number
): ChartDataPoint[] {
  return dataPoints.map((point, index) => ({
    ...point,
    movingAverage: index < windowSize - 1
      ? null
      : dataPoints
          .slice(index - windowSize + 1, index + 1)
          .reduce((sum, p) => sum + p.value, 0) / windowSize
  }))
}
