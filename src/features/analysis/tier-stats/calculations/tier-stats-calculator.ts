import type { ParsedGameRun } from '@/features/data-tracking/types/game-run.types'
import type {
  DynamicTierStats,
  FieldStats,
  TierStatsColumnConfig,
  TierStatsColumn,
  AvailableField
} from '../types'
import { TierStatsAggregation } from '../types'
import { getFieldValue } from '@/features/analysis/shared/parsing/field-utils'
import { getColumnDisplayName } from '../config/tier-stats-config-utils'
import { calculateFieldPercentiles } from './field-percentile-calculation'

/**
 * Calculate dynamic tier stats for all tiers based on selected columns
 */
export function calculateDynamicTierStats(
  runs: ParsedGameRun[],
  selectedColumns: TierStatsColumnConfig[]
): DynamicTierStats[] {
  // Group runs by tier
  const tierGroups = new Map<number, ParsedGameRun[]>()

  runs.forEach(run => {
    if (run.tier) {
      if (!tierGroups.has(run.tier)) {
        tierGroups.set(run.tier, [])
      }
      tierGroups.get(run.tier)!.push(run)
    }
  })

  // Calculate stats for each tier
  const tierStats: DynamicTierStats[] = []

  tierGroups.forEach((tierRuns, tier) => {
    const fields: Record<string, FieldStats> = {}

    // Calculate stats for each selected column
    selectedColumns.forEach(column => {
      const fieldStats = calculateFieldStats(tierRuns, column.fieldName)
      if (fieldStats) {
        fields[column.fieldName] = fieldStats
      }
    })

    tierStats.push({
      tier,
      runCount: tierRuns.length,
      fields
    })
  })

  return tierStats.sort((a, b) => b.tier - a.tier) // Highest tier first
}

/**
 * Calculate statistics for a specific field across runs in a tier
 * Computes max, P99, P90, P75, and P50 values with per-field percentile tracking
 * Each percentile tracks both its value AND the duration from its source run for accurate hourly rates
 */
export function calculateFieldStats(
  runs: ParsedGameRun[],
  fieldName: string
): FieldStats | null {
  let maxValue = -Infinity
  let maxValueRun: ParsedGameRun | null = null
  let longestDuration = 0
  let longestDurationRun: ParsedGameRun | null = null

  // Find maximum value by scanning all runs
  runs.forEach(run => {
    const value = getFieldValue<number>(run, fieldName)

    if (value !== null) {
      // Track maximum value
      if (value > maxValue) {
        maxValue = value
        maxValueRun = run
      }
    }

    // Track longest duration
    const duration = run.realTime
    if (duration > longestDuration) {
      longestDuration = duration
      longestDurationRun = run
    }
  })

  if (!maxValueRun) return null

  // Calculate percentiles with source run tracking
  // This sorts runs by THIS field's value and tracks the duration from the run at each percentile position
  const percentiles = calculateFieldPercentiles(
    runs,
    (run) => getFieldValue<number>(run, fieldName)
  )

  const fieldStats: FieldStats = {
    maxValue,
    maxValueRun: maxValueRun as ParsedGameRun,
    p99Value: percentiles.p99?.value ?? null,
    p99Duration: percentiles.p99?.duration ?? null,
    p90Value: percentiles.p90?.value ?? null,
    p90Duration: percentiles.p90?.duration ?? null,
    p75Value: percentiles.p75?.value ?? null,
    p75Duration: percentiles.p75?.duration ?? null,
    p50Value: percentiles.p50?.value ?? null,
    p50Duration: percentiles.p50?.duration ?? null,
    longestDuration,
    longestDurationRun: longestDurationRun ?? undefined
  }

  // Calculate hourly rate based on the run that achieved max value
  const runRealTime = (maxValueRun as ParsedGameRun).realTime
  if (runRealTime > 0 && typeof maxValue === 'number') {
    fieldStats.hourlyRate = (maxValue / runRealTime) * 3600
  }

  return fieldStats
}

/**
 * Build column definitions for table rendering
 * Now creates one column per field, with hourly rate shown in same cell
 */
export function buildColumnDefinitions(
  selectedColumns: TierStatsColumnConfig[],
  availableFields: AvailableField[]
): TierStatsColumn[] {
  const columns: TierStatsColumn[] = []

  selectedColumns.forEach(columnConfig => {
    const field = availableFields.find(f => f.fieldName === columnConfig.fieldName)
    if (!field) return

    // Add single column (hourly rate will be shown in same cell if enabled)
    columns.push({
      id: columnConfig.fieldName,
      fieldName: columnConfig.fieldName,
      displayName: getColumnDisplayName(columnConfig.fieldName, false, availableFields),
      showHourlyRate: columnConfig.showHourlyRate && field.canHaveHourlyRate,
      dataType: field.dataType
    })
  })

  return columns
}

/**
 * Helper to extract percentile value and duration from field stats
 * Centralizes the mapping between aggregation types and field properties
 */
function getPercentileData(
  fieldStats: FieldStats,
  aggregationType: TierStatsAggregation
): { value: number | null; duration: number | null } {
  switch (aggregationType) {
    case TierStatsAggregation.MAX:
      return {
        value: fieldStats.maxValue,
        duration: fieldStats.maxValueRun.realTime
      }
    case TierStatsAggregation.P99:
      return {
        value: fieldStats.p99Value,
        duration: fieldStats.p99Duration
      }
    case TierStatsAggregation.P90:
      return {
        value: fieldStats.p90Value,
        duration: fieldStats.p90Duration
      }
    case TierStatsAggregation.P75:
      return {
        value: fieldStats.p75Value,
        duration: fieldStats.p75Duration
      }
    case TierStatsAggregation.P50:
      return {
        value: fieldStats.p50Value,
        duration: fieldStats.p50Duration
      }
    default:
      return {
        value: fieldStats.maxValue,
        duration: fieldStats.maxValueRun.realTime
      }
  }
}

/**
 * Get the value to display in a table cell based on aggregation type
 */
export function getCellValue(
  tierStats: DynamicTierStats,
  fieldName: string,
  isHourlyRate: boolean,
  aggregationType: TierStatsAggregation = TierStatsAggregation.MAX
): number | null {
  const fieldStats = tierStats.fields[fieldName]
  if (!fieldStats) return null

  // Use helper to get value and duration in one call
  const { value, duration } = getPercentileData(fieldStats, aggregationType)

  if (isHourlyRate) {
    // For MAX aggregation: use pre-calculated hourly rate
    if (aggregationType === TierStatsAggregation.MAX) {
      return fieldStats.hourlyRate ?? null
    }

    // For percentiles: calculate hourly rate using percentile value / percentile-specific duration
    // Each percentile tracks the duration from its source run for accurate hourly rates
    if (value === null || duration === null || duration === 0) {
      return null
    }

    // Calculate hourly rate: (percentile_value / percentile_run_duration_seconds) * 3600
    return (value / duration) * 3600
  }

  // Return the aggregation value
  return value
}

/**
 * Calculate summary statistics across all tiers
 */
export interface TierStatsSummary {
  totalTiers: number
  totalRuns: number
  highestValues: Record<string, number>
}

export function calculateSummaryStats(
  tierStats: DynamicTierStats[],
  selectedColumns: TierStatsColumnConfig[]
): TierStatsSummary {
  const highestValues: Record<string, number> = {}
  let totalRuns = 0

  tierStats.forEach(tier => {
    totalRuns += tier.runCount

    selectedColumns.forEach(column => {
      const fieldStats = tier.fields[column.fieldName]
      if (fieldStats) {
        const current = highestValues[column.fieldName] ?? -Infinity
        highestValues[column.fieldName] = Math.max(current, fieldStats.maxValue)
      }
    })
  })

  return {
    totalTiers: tierStats.length,
    totalRuns,
    highestValues
  }
}
