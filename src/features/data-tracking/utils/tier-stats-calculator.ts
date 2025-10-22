import type { ParsedGameRun } from '../types/game-run.types'
import type {
  DynamicTierStats,
  FieldStats,
  TierStatsColumnConfig,
  TierStatsColumn,
  AvailableField
} from '../types/tier-stats-config.types'
import { getFieldValue } from './field-utils'
import { getColumnDisplayName } from './tier-stats-config'

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
 */
export function calculateFieldStats(
  runs: ParsedGameRun[],
  fieldName: string
): FieldStats | null {
  let maxValue = -Infinity
  let maxValueRun: ParsedGameRun | null = null
  let longestDuration = 0
  let longestDurationRun: ParsedGameRun | null = null

  runs.forEach(run => {
    const value = getFieldValue<number>(run, fieldName)

    // Track maximum value
    if (value !== null && value > maxValue) {
      maxValue = value
      maxValueRun = run
    }

    // Track longest duration for reference
    const duration = run.realTime
    if (duration > longestDuration) {
      longestDuration = duration
      longestDurationRun = run
    }
  })

  if (!maxValueRun) return null

  const fieldStats: FieldStats = {
    maxValue,
    maxValueRun: maxValueRun as ParsedGameRun,
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
 * Get the value to display in a table cell
 */
export function getCellValue(
  tierStats: DynamicTierStats,
  fieldName: string,
  isHourlyRate: boolean
): number | null {
  const fieldStats = tierStats.fields[fieldName]
  if (!fieldStats) return null

  return isHourlyRate ? fieldStats.hourlyRate ?? null : fieldStats.maxValue
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
