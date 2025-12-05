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
// D3: Reuse period utilities from source-analysis
import {
  getPeriodKey as getPeriodKeySource,
  formatPeriodLabel as formatPeriodLabelSource,
} from '@/features/analysis/source-analysis/calculations/period-grouping'
import type { SourceDuration } from '@/features/analysis/source-analysis/types'

// Type-safe wrapper functions to bridge Duration and SourceDuration
function getPeriodKey(timestamp: Date, duration: Duration): string {
  return getPeriodKeySource(timestamp, duration as unknown as SourceDuration)
}

function formatPeriodLabel(key: string, duration: Duration, index?: number, totalRuns?: number): string {
  return formatPeriodLabelSource(key, duration as unknown as SourceDuration, index, totalRuns)
}


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
 * Get the most recent N periods of data
 */
export function limitToPeriods(
  groups: Map<string, ParsedGameRun[]>,
  quantity: number,
  duration: Duration
): Map<string, ParsedGameRun[]> {
  // Sort keys by date (most recent first)
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (duration === 'per-run') {
      return new Date(b).getTime() - new Date(a).getTime()
    }
    return b.localeCompare(a)
  })

  // Take only the most recent N periods
  const limitedKeys = sortedKeys.slice(0, quantity)

  // Reverse to get oldest first for chart display
  const result = new Map<string, ParsedGameRun[]>()
  for (const key of limitedKeys.reverse()) {
    const value = groups.get(key)
    if (value) {
      result.set(key, value)
    }
  }

  return result
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
