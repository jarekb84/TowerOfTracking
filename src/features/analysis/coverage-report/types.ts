/**
 * Coverage Report Types
 *
 * Type definitions for the Coverage Report Analytics feature.
 * Coverage metrics show the percentage of enemies affected by each game mechanic.
 */

import type { Duration } from '@/shared/domain/filters'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { RunInfo } from '@/features/analysis/shared/tooltips/run-info-header'

// Re-export shared RunInfo for coverage report consumers
export type { RunInfo as CoverageRunInfo } from '@/features/analysis/shared/tooltips/run-info-header'

// Local alias for use within this file
type CoverageRunInfo = RunInfo

/**
 * Category grouping for coverage metrics
 */
export type MetricCategory = 'economic' | 'combat'

/**
 * Field names for the 9 coverage metrics
 */
export type CoverageFieldName =
  // Economic (4)
  | 'taggedByDeathwave'
  | 'destroyedInSpotlight'
  | 'destroyedInGoldenBot'
  | 'summonedEnemies'
  // Combat (5)
  | 'enemiesHitByOrbs'
  | 'destroyedByOrbs'
  | 'destroyedByDeathRay'
  | 'destroyedByThorns'
  | 'destroyedByLandMine'

/**
 * Definition for a single coverage metric
 */
export interface CoverageMetricDefinition {
  fieldName: CoverageFieldName
  label: string
  category: MetricCategory
  color: string
}

/**
 * Filter state for the coverage report
 */
export interface CoverageReportFilters {
  /** Selected metrics to display */
  selectedMetrics: Set<CoverageFieldName>
  /** Run type filter */
  runType: RunTypeFilter
  /** Tier filter */
  tier: number | 'all'
  /** Time grouping duration */
  duration: Duration
  /** Number of periods to show */
  periodCount: number
}

/**
 * Coverage data for a single metric in a period
 */
export interface MetricCoverage {
  fieldName: CoverageFieldName
  label: string
  color: string
  /** Coverage percentage (0-100) */
  percentage: number
  /** Count of enemies affected by this mechanic */
  affectedCount: number
  /** Total enemies in the period */
  totalEnemies: number
}

/**
 * Coverage data for a single time period
 */
export interface PeriodCoverageData {
  /** Period identifier (e.g., "2024-W12", "2024-03-15") */
  periodKey: string
  /** Display label for the period */
  periodLabel: string
  /** Coverage data for each selected metric */
  metrics: MetricCoverage[]
  /** Total enemies destroyed in this period */
  totalEnemies: number
  /** Number of runs in this period */
  runCount: number
  /** Optional run info for per-run periods (single run data points) */
  runInfo?: CoverageRunInfo
}

/**
 * Summary coverage data across all periods
 */
export interface CoverageSummary {
  /** Overall coverage for each metric across all periods */
  metrics: MetricCoverage[]
  /** Total enemies across all periods */
  totalEnemies: number
  /** Total runs analyzed */
  totalRuns: number
}

/**
 * Complete analysis result for coverage report
 */
export interface CoverageAnalysisData {
  /** Filter state used for this analysis */
  filters: CoverageReportFilters
  /** Coverage data by time period */
  periods: PeriodCoverageData[]
  /** Summary across all periods */
  summary: CoverageSummary
}

/**
 * Default filter values for coverage report
 * D5: Default to 3 Economic metrics (core income mechanics)
 */
export const DEFAULT_COVERAGE_FILTERS: CoverageReportFilters = {
  selectedMetrics: new Set<CoverageFieldName>([
    'taggedByDeathwave',
    'destroyedInSpotlight',
    'destroyedInGoldenBot',
  ]),
  runType: 'farm',
  tier: 'all',
  duration: 'daily' as Duration,
  periodCount: 14,
}
