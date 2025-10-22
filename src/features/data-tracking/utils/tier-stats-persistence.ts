import type { TierStatsConfig } from '../types/tier-stats-config.types'
import { getDefaultConfig } from './tier-stats-config'

const STORAGE_KEY = 'tower-tracking-tier-stats-config'

/**
 * Load tier stats configuration from localStorage
 * Returns default config if none exists or if parsing fails
 */
export function loadTierStatsConfig(): TierStatsConfig {
  if (typeof window === 'undefined') {
    return getDefaultConfig()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return getDefaultConfig()
    }

    const parsed = JSON.parse(stored) as TierStatsConfig
    return validateStoredConfig(parsed)
  } catch (error) {
    console.warn('Failed to load tier stats config from localStorage:', error)
    return getDefaultConfig()
  }
}

/**
 * Save tier stats configuration to localStorage
 */
export function saveTierStatsConfig(config: TierStatsConfig): void {
  if (typeof window === 'undefined') return

  try {
    const updated = {
      ...config,
      lastUpdated: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save tier stats config to localStorage:', error)
  }
}

/**
 * Type guard to check if value is a valid column config
 */
function isValidColumnConfig(col: unknown): col is { fieldName: string; showHourlyRate: boolean } {
  return (
    col !== null &&
    typeof col === 'object' &&
    'fieldName' in col &&
    'showHourlyRate' in col &&
    typeof col.fieldName === 'string' &&
    typeof col.showHourlyRate === 'boolean'
  )
}

/**
 * Validate stored configuration has required fields
 */
function validateStoredConfig(config: unknown): TierStatsConfig {
  const defaultConfig = getDefaultConfig()

  // Ensure all required fields exist
  if (
    !config ||
    typeof config !== 'object' ||
    !('selectedColumns' in config) ||
    !('configSectionCollapsed' in config) ||
    !Array.isArray(config.selectedColumns) ||
    typeof config.configSectionCollapsed !== 'boolean'
  ) {
    return defaultConfig
  }

  // Validate column structure
  const validColumns = config.selectedColumns.every(isValidColumnConfig)

  if (!validColumns) {
    return defaultConfig
  }

  return config as TierStatsConfig
}

/**
 * Clear tier stats configuration from localStorage
 */
export function clearTierStatsConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear tier stats config from localStorage:', error)
  }
}
