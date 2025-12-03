/**
 * Mini Coverage Report Calculations
 *
 * Pure functions for calculating coverage metrics for a single run.
 * Composes existing coverage calculation functions from the analysis feature.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { MetricCoverage, MetricCategory } from '@/features/analysis/coverage-report/types'
import {
  hasValidCoverageData,
  calculateMetricCoverageForRun,
  filterNonZeroCoverage,
  sortMetricsByPercentage,
} from '@/features/analysis/coverage-report/calculations/coverage-calculations'
import {
  getEconomicMetrics,
  getCombatMetrics,
} from '@/features/analysis/coverage-report/coverage-config'

export { hasValidCoverageData }

/**
 * Coverage data grouped by category for display
 */
export interface MiniCoverageData {
  economicMetrics: MetricCoverage[]
  combatMetrics: MetricCoverage[]
}

/**
 * Calculate coverage metrics for a category from a single run
 * Returns metrics sorted by percentage descending, filtered to non-zero values
 */
function calculateCategoryMetrics(
  run: ParsedGameRun,
  category: MetricCategory
): MetricCoverage[] {
  const metricDefinitions = category === 'economic' ? getEconomicMetrics() : getCombatMetrics()

  const metrics = metricDefinitions.map((metric) => calculateMetricCoverageForRun(run, metric))

  return sortMetricsByPercentage(filterNonZeroCoverage(metrics))
}

/**
 * Calculate all coverage metrics for a single run
 * Returns null if the run has no valid coverage data (no totalEnemies)
 */
export function calculateMiniCoverageData(run: ParsedGameRun): MiniCoverageData | null {
  if (!hasValidCoverageData(run)) {
    return null
  }

  const economicMetrics = calculateCategoryMetrics(run, 'economic')
  const combatMetrics = calculateCategoryMetrics(run, 'combat')

  // Return null if both categories are empty (all metrics zero)
  if (economicMetrics.length === 0 && combatMetrics.length === 0) {
    return null
  }

  return {
    economicMetrics,
    combatMetrics,
  }
}
