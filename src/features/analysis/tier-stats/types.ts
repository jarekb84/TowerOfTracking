import type { ParsedGameRun } from '@/features/data-tracking/types/game-run.types'

/**
 * Aggregation methods for tier statistics
 */
export enum TierStatsAggregation {
  MAX = 'max',
  P99 = 'p99',
  P90 = 'p90',
  P75 = 'p75',
  P50 = 'p50',
}

/**
 * Configuration for a single column in the tier stats table
 */
export interface TierStatsColumnConfig {
  fieldName: string
  showHourlyRate: boolean
}

/**
 * Complete tier stats configuration persisted to localStorage
 */
export interface TierStatsConfig {
  selectedColumns: TierStatsColumnConfig[]
  configSectionCollapsed: boolean
  aggregationType: TierStatsAggregation
  lastUpdated: number
}

/**
 * Available field for column selection
 */
export interface AvailableField {
  fieldName: string
  displayName: string
  dataType: 'number' | 'duration' | 'string' | 'date'
  isNumeric: boolean
  canHaveHourlyRate: boolean // Whether hourly rate makes sense for this field
}

/**
 * Column definition for dynamic table rendering
 */
export interface TierStatsColumn {
  id: string
  fieldName: string
  displayName: string
  showHourlyRate: boolean // Whether to show hourly rate in this column's cell
  dataType: 'number' | 'duration' | 'string' | 'date'
}

/**
 * Stats data for a single tier with dynamic fields
 */
export interface DynamicTierStats {
  tier: number
  runCount: number
  fields: Record<string, FieldStats>
}

/**
 * Statistics for a specific field within a tier
 * Contains all aggregation values computed from runs
 * Each percentile tracks its value AND the duration from its source run for accurate hourly rates
 */
export interface FieldStats {
  maxValue: number
  maxValueRun: ParsedGameRun
  p99Value: number | null
  p99Duration: number | null // Duration of the run at P99 position
  p90Value: number | null
  p90Duration: number | null // Duration of the run at P90 position
  p75Value: number | null
  p75Duration: number | null // Duration of the run at P75 position
  p50Value: number | null
  p50Duration: number | null // Duration of the run at P50 position
  hourlyRate?: number // Hourly rate for max value (from specific run)
  longestDuration?: number // Track longest run duration for reference
  longestDurationRun?: ParsedGameRun
}

/**
 * Tooltip data for cell hover information
 */
export interface CellTooltipData {
  fieldName: string
  displayName: string
  value: number
  run: ParsedGameRun
  wave: number
  duration: number
  timestamp: Date
  isHourlyRate: boolean
  hourlyRateContext?: {
    baseValue: number
    runDuration: number
  }
}
