/**
 * Period Grouping Logic for Coverage Report
 *
 * Pure functions for grouping runs by time periods and calculating
 * aggregate coverage metrics per period.
 *
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { Duration } from '@/shared/domain/filters'
import type {
  CoverageReportFilters,
  CoverageFieldName,
  PeriodCoverageData,
  CoverageSummary,
  CoverageAnalysisData,
  MetricCoverage,
} from '../types'
import { extractRunInfo } from '@/features/analysis/shared/tooltips/run-info-header'
import { getMetricByFieldName } from '../coverage-config'
import {
  hasValidCoverageData,
  sumTotalEnemies,
  sumAffectedCounts,
  calculateCoveragePercentage,
} from './coverage-calculations'
// Shared period utilities used across analysis features
import {
  getPeriodKey,
  formatPeriodLabel,
  limitToPeriods,
} from '@/features/analysis/shared/period-grouping'
// Re-export limitToPeriods so existing consumers (tests) can still import from here
export { limitToPeriods }


/**
 * Apply filters to runs
 * D4: Also excludes runs without valid totalEnemies
 */
export function filterRuns(
  runs: ParsedGameRun[],
  filters: CoverageReportFilters
): ParsedGameRun[] {
  return runs.filter(run => {
    // D4: Exclude runs without totalEnemies
    if (!hasValidCoverageData(run)) {
      return false
    }

    // Filter by run type
    if (filters.runType !== 'all' && run.runType !== filters.runType) {
      return false
    }

    // Filter by tier
    if (filters.tier !== 'all' && run.tier !== filters.tier) {
      return false
    }

    return true
  })
}

/**
 * Group runs by the specified duration period
 */
export function groupRunsByPeriod(
  runs: ParsedGameRun[],
  duration: Duration
): Map<string, ParsedGameRun[]> {
  const groups = new Map<string, ParsedGameRun[]>()

  for (const run of runs) {
    const key = getPeriodKey(run.timestamp, duration)
    const existing = groups.get(key) || []
    groups.set(key, [...existing, run])
  }

  return groups
}

/**
 * Options for calculating period coverage
 */
interface PeriodCoverageOptions {
  runs: ParsedGameRun[]
  selectedMetrics: Set<CoverageFieldName>
  periodKey: string
  periodLabel: string
  isPerRunPeriod?: boolean
}

/**
 * Calculate coverage metrics for a group of runs in one period
 */
export function calculatePeriodCoverage(options: PeriodCoverageOptions): PeriodCoverageData {
  const {
    runs,
    selectedMetrics,
    periodKey,
    periodLabel,
    isPerRunPeriod = false,
  } = options
  const totalEnemies = sumTotalEnemies(runs)

  const metrics: MetricCoverage[] = Array.from(selectedMetrics).map(fieldName => {
    const metricDef = getMetricByFieldName(fieldName)
    if (!metricDef) {
      throw new Error(`Unknown metric field: ${fieldName}`)
    }

    const affectedCount = sumAffectedCounts(runs, fieldName)
    const percentage = calculateCoveragePercentage(affectedCount, totalEnemies)

    return {
      fieldName,
      label: metricDef.label,
      color: metricDef.color,
      percentage,
      affectedCount,
      totalEnemies,
    }
  })

  // Include run info only for per-run periods with a single run
  const runInfo = isPerRunPeriod && runs.length === 1
    ? extractRunInfo(runs[0])
    : undefined

  return {
    periodKey,
    periodLabel,
    metrics,
    totalEnemies,
    runCount: runs.length,
    runInfo,
  }
}

/**
 * Calculate overall summary across all periods
 */
export function calculateCoverageSummary(
  periods: PeriodCoverageData[],
  selectedMetrics: Set<CoverageFieldName>
): CoverageSummary {
  const totalRuns = periods.reduce((sum, p) => sum + p.runCount, 0)
  const totalEnemies = periods.reduce((sum, p) => sum + p.totalEnemies, 0)

  // Sum affected counts across all periods for each metric
  const affectedTotals = new Map<CoverageFieldName, number>()
  for (const fieldName of selectedMetrics) {
    affectedTotals.set(fieldName, 0)
  }

  for (const period of periods) {
    for (const metric of period.metrics) {
      const current = affectedTotals.get(metric.fieldName) || 0
      affectedTotals.set(metric.fieldName, current + metric.affectedCount)
    }
  }

  // Build summary metrics
  const metrics: MetricCoverage[] = Array.from(selectedMetrics).map(fieldName => {
    const metricDef = getMetricByFieldName(fieldName)
    if (!metricDef) {
      throw new Error(`Unknown metric field: ${fieldName}`)
    }

    const affectedCount = affectedTotals.get(fieldName) || 0
    const percentage = calculateCoveragePercentage(affectedCount, totalEnemies)

    return {
      fieldName,
      label: metricDef.label,
      color: metricDef.color,
      percentage,
      affectedCount,
      totalEnemies,
    }
  })

  return {
    metrics,
    totalEnemies,
    totalRuns,
  }
}

/**
 * Main calculation function - produces complete coverage analysis data
 */
export function calculateCoverageAnalysis(
  runs: ParsedGameRun[],
  filters: CoverageReportFilters
): CoverageAnalysisData {
  // Apply filters
  const filteredRuns = filterRuns(runs, filters)

  // Sort by timestamp (oldest first for consistent grouping)
  const sortedRuns = [...filteredRuns].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  // Group by period
  let groups = groupRunsByPeriod(sortedRuns, filters.duration)

  // Limit to requested quantity
  groups = limitToPeriods(groups, filters.periodCount, filters.duration)

  // Calculate coverage for each period
  const groupEntries = Array.from(groups.entries())
  const totalRuns = groupEntries.length
  const isPerRunPeriod = filters.duration === 'per-run'

  const periods: PeriodCoverageData[] = groupEntries.map(([key, periodRuns], index) => {
    const label = formatPeriodLabel(key, filters.duration, index, totalRuns)
    return calculatePeriodCoverage({
      runs: periodRuns,
      selectedMetrics: filters.selectedMetrics,
      periodKey: key,
      periodLabel: label,
      isPerRunPeriod,
    })
  })

  // Calculate overall summary
  const summary = calculateCoverageSummary(periods, filters.selectedMetrics)

  return {
    filters,
    periods,
    summary,
  }
}
