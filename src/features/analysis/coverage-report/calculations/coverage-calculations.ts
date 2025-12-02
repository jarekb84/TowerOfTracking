/**
 * Coverage Calculations
 *
 * Pure functions for extracting field values and calculating coverage percentages.
 * Coverage = (affected count / total enemies) * 100
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { CoverageFieldName, MetricCoverage, CoverageMetricDefinition } from '../types'

/** Field name for total enemies destroyed in a run */
const TOTAL_ENEMIES_FIELD = 'totalEnemies'

/**
 * Extract numeric value from a game run field
 * Returns 0 if field doesn't exist or isn't a number
 */
export function extractFieldValue(run: ParsedGameRun, fieldName: string): number {
  const field = run.fields[fieldName]
  if (field && typeof field.value === 'number') {
    return field.value
  }
  return 0
}

/**
 * Get total enemies destroyed from a run
 */
export function getTotalEnemies(run: ParsedGameRun): number {
  return extractFieldValue(run, TOTAL_ENEMIES_FIELD)
}

/**
 * Check if a run has valid coverage data (totalEnemies > 0)
 * D4: Runs without total enemies cannot produce meaningful coverage percentages
 */
export function hasValidCoverageData(run: ParsedGameRun): boolean {
  return getTotalEnemies(run) > 0
}

/**
 * Calculate coverage percentage with proper edge case handling
 * Returns 0 if total is 0 to avoid division by zero
 */
export function calculateCoveragePercentage(affected: number, total: number): number {
  if (total === 0 || affected === 0) {
    return 0
  }
  // Round to 2 decimal places for display
  return Math.round((affected / total) * 10000) / 100
}

/**
 * Calculate coverage for a single metric from a single run
 */
export function calculateMetricCoverageForRun(
  run: ParsedGameRun,
  metric: CoverageMetricDefinition
): MetricCoverage {
  const totalEnemies = getTotalEnemies(run)
  const affectedCount = extractFieldValue(run, metric.fieldName)
  const percentage = calculateCoveragePercentage(affectedCount, totalEnemies)

  return {
    fieldName: metric.fieldName,
    label: metric.label,
    color: metric.color,
    percentage,
    affectedCount,
    totalEnemies,
  }
}

/**
 * Sum affected counts for a metric across multiple runs
 */
export function sumAffectedCounts(
  runs: ParsedGameRun[],
  fieldName: CoverageFieldName
): number {
  return runs.reduce((sum, run) => sum + extractFieldValue(run, fieldName), 0)
}

/**
 * Sum total enemies across multiple runs
 */
export function sumTotalEnemies(runs: ParsedGameRun[]): number {
  return runs.reduce((sum, run) => sum + getTotalEnemies(run), 0)
}

/**
 * Calculate coverage for a metric across multiple runs
 */
export function calculateMetricCoverage(
  runs: ParsedGameRun[],
  metric: CoverageMetricDefinition
): MetricCoverage {
  const totalEnemies = sumTotalEnemies(runs)
  const affectedCount = sumAffectedCounts(runs, metric.fieldName)
  const percentage = calculateCoveragePercentage(affectedCount, totalEnemies)

  return {
    fieldName: metric.fieldName,
    label: metric.label,
    color: metric.color,
    percentage,
    affectedCount,
    totalEnemies,
  }
}


/**
 * Sort metrics by percentage descending
 */
export function sortMetricsByPercentage(metrics: MetricCoverage[]): MetricCoverage[] {
  return [...metrics].sort((a, b) => {
    const percentDiff = b.percentage - a.percentage
    if (percentDiff !== 0) return percentDiff
    // Tiebreaker: higher affected count first
    return b.affectedCount - a.affectedCount
  })
}

/**
 * Filter metrics to only include those with non-zero coverage
 */
export function filterNonZeroCoverage(metrics: MetricCoverage[]): MetricCoverage[] {
  return metrics.filter(m => m.percentage > 0)
}
