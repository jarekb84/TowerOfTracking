import type { ParsedGameRun } from './game-run.types'

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
 */
export interface FieldStats {
  maxValue: number
  maxValueRun: ParsedGameRun
  hourlyRate?: number // Only present for numeric fields
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
