import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type {
  AvailableField,
  TierStatsColumnConfig,
  TierStatsConfig
} from '../types'
import { TierStatsAggregation } from '../types'

/**
 * Default columns for tier stats table
 */
export const DEFAULT_COLUMNS: TierStatsColumnConfig[] = [
  { fieldName: 'wave', showHourlyRate: false },
  { fieldName: 'realTime', showHourlyRate: false },
  { fieldName: 'coinsEarned', showHourlyRate: true },
  { fieldName: 'cellsEarned', showHourlyRate: true }
]

/**
 * Default configuration for tier stats
 */
export function getDefaultConfig(): TierStatsConfig {
  return {
    selectedColumns: DEFAULT_COLUMNS,
    configSectionCollapsed: true,
    aggregationType: TierStatsAggregation.MAX,
    lastUpdated: Date.now()
  }
}

/**
 * Discover all available fields from runs data
 * Excludes internal fields (prefixed with _) and non-tier-stat fields
 */
export function discoverAvailableFields(runs: ParsedGameRun[]): AvailableField[] {
  if (runs.length === 0) return []

  const fieldMap = new Map<string, AvailableField>()

  // Sample first run to get field structure
  const sampleRun = runs[0]

  Object.entries(sampleRun.fields).forEach(([fieldName, field]) => {
    // Skip internal fields
    if (fieldName.startsWith('_')) return

    // Skip tier field (used as row grouping identifier)
    if (fieldName === 'tier') return

    // Skip date/time fields (not useful for tier stats)
    if (field.dataType === 'date') return

    // Skip run type field (already filtered at higher level)
    if (fieldName === 'runType') return

    // Skip string-only fields (not aggregatable)
    if (field.dataType === 'string') return

    const isNumeric = field.dataType === 'number' || field.dataType === 'duration'

    // Hourly rates don't make sense for duration fields (hours per hour = 1)
    const canHaveHourlyRate = field.dataType === 'number'

    fieldMap.set(fieldName, {
      fieldName,
      displayName: field.originalKey,
      dataType: field.dataType,
      isNumeric,
      canHaveHourlyRate
    })
  })

  return Array.from(fieldMap.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )
}

/**
 * Get fields that are not currently selected
 */
export function getUnselectedFields(
  availableFields: AvailableField[],
  selectedColumns: TierStatsColumnConfig[]
): AvailableField[] {
  const selectedFieldNames = new Set(selectedColumns.map(col => col.fieldName))
  return availableFields.filter(field => !selectedFieldNames.has(field.fieldName))
}

/**
 * Validate column configuration against available fields
 * Removes columns that no longer exist in the data
 */
export function validateColumnConfig(
  config: TierStatsColumnConfig[],
  availableFields: AvailableField[]
): TierStatsColumnConfig[] {
  const validFieldNames = new Set(availableFields.map(f => f.fieldName))
  return config.filter(col => validFieldNames.has(col.fieldName))
}

/**
 * Check if a field name is valid and numeric (can have hourly rates)
 */
export function isNumericField(
  fieldName: string,
  availableFields: AvailableField[]
): boolean {
  const field = availableFields.find(f => f.fieldName === fieldName)
  return field?.isNumeric ?? false
}

/**
 * Check if a field can have hourly rates (excludes duration fields)
 */
export function canFieldHaveHourlyRate(
  fieldName: string,
  availableFields: AvailableField[]
): boolean {
  const field = availableFields.find(f => f.fieldName === fieldName)
  return field?.canHaveHourlyRate ?? false
}

/**
 * Get display name for a field
 */
export function getFieldDisplayName(
  fieldName: string,
  availableFields: AvailableField[]
): string {
  const field = availableFields.find(f => f.fieldName === fieldName)
  return field?.displayName ?? fieldName
}

/**
 * Generate column display name including hourly rate suffix
 */
export function getColumnDisplayName(
  fieldName: string,
  isHourlyRate: boolean,
  availableFields: AvailableField[]
): string {
  const baseName = getFieldDisplayName(fieldName, availableFields)

  // Special case for duration fields
  if (fieldName === 'realTime') {
    return isHourlyRate ? `${baseName}/Hour` : 'Longest Run Duration'
  }

  return isHourlyRate ? `${baseName}/Hour` : baseName
}
