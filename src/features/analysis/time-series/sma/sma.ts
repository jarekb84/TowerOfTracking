import type { ChartDataPoint } from '../chart-types'

/**
 * Calculate Simple Moving Average for chart data points
 *
 * @param dataPoints - Array of chart data points with values
 * @param period - Number of points to average (3, 5, or 10)
 * @returns New array with sma property added to each point
 */
export function calculateSma(
  dataPoints: ChartDataPoint[],
  period: number
): ChartDataPoint[] {
  return dataPoints.map((point, index) => ({
    ...point,
    sma: index < period - 1
      ? null
      : dataPoints
          .slice(index - period + 1, index + 1)
          .reduce((sum, p) => sum + p.value, 0) / period
  }))
}
