/**
 * Chart Data Transform Functions
 *
 * Pure functions for transforming coverage data into chart-ready formats.
 */

import type { PeriodCoverageData, MetricCoverage } from '../types'

/**
 * Tooltip entry structure for coverage chart tooltips
 */
interface TooltipEntry {
  label: string
  color: string
  affectedCount: number
  percentage: number
  fieldName: string
}

/**
 * Chart data point structure for Recharts bar charts
 */
export interface ChartDataPoint {
  periodLabel: string
  periodKey: string
  totalEnemies: number
  runCount: number
  [fieldName: string]: number | string
}

/**
 * Transform period coverage data into grouped bar chart format
 *
 * Flattens the metrics array into individual properties on each data point
 * for consumption by Recharts Bar components.
 */
export function transformToChartData(periods: PeriodCoverageData[]): ChartDataPoint[] {
  return periods.map(period => {
    const point: ChartDataPoint = {
      periodLabel: period.periodLabel,
      periodKey: period.periodKey,
      totalEnemies: period.totalEnemies,
      runCount: period.runCount,
    }

    for (const metric of period.metrics) {
      point[metric.fieldName] = metric.percentage
    }

    return point
  })
}

/**
 * Build tooltip entries from metrics, sorted by percentage descending
 */
export function buildTooltipEntries(metrics: MetricCoverage[]): TooltipEntry[] {
  return [...metrics]
    .sort((a, b) => b.percentage - a.percentage)
    .map(metric => ({
      label: metric.label,
      color: metric.color,
      affectedCount: metric.affectedCount,
      percentage: metric.percentage,
      fieldName: metric.fieldName,
    }))
}

/**
 * Calculate the Y-axis maximum value for charts based on data
 * Rounds up to nearest 25% for clean axis ticks
 *
 * @param periods Coverage data periods to analyze
 * @param useRelativeAxis Whether to scale axis to data or use fixed 100%
 * @returns Y-axis maximum (25, 50, 75, or 100)
 */
export function calculateYAxisMax(
  periods: PeriodCoverageData[],
  useRelativeAxis: boolean
): number {
  if (!useRelativeAxis || periods.length === 0) {
    return 100
  }

  let maxPercentage = 0
  for (const period of periods) {
    for (const metric of period.metrics) {
      if (metric.percentage > maxPercentage) {
        maxPercentage = metric.percentage
      }
    }
  }

  const rounded = Math.ceil(maxPercentage / 25) * 25
  return Math.max(25, Math.min(100, rounded))
}

/**
 * Calculate bar opacity based on highlight state
 */
export function getBarOpacity(
  highlightedMetric: string | null,
  metricFieldName: string,
  type: 'fill' | 'stroke'
): number {
  const activeOpacity = type === 'fill' ? 0.9 : 0.7
  const highlightedOpacity = type === 'fill' ? 0.9 : 0.85
  const dimmedOpacity = 0.25

  if (highlightedMetric === null) return activeOpacity
  return highlightedMetric === metricFieldName ? highlightedOpacity : dimmedOpacity
}
