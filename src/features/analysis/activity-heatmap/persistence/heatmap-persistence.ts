import type { ActiveHoursConfig } from '../types'
import { DEFAULT_ACTIVE_HOURS } from '../types'

const STORAGE_KEY = 'tower-tracking-activity-heatmap-config'

/**
 * Load heatmap configuration from localStorage.
 * Returns DEFAULT_ACTIVE_HOURS if not found, invalid, or during SSR.
 */
export function loadHeatmapConfig(): ActiveHoursConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTIVE_HOURS
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_ACTIVE_HOURS
    }

    const parsed = JSON.parse(stored) as ActiveHoursConfig
    return validateStoredConfig(parsed)
  } catch (error) {
    console.warn('Failed to load heatmap config from localStorage:', error)
    return DEFAULT_ACTIVE_HOURS
  }
}

/**
 * Save heatmap configuration to localStorage.
 */
export function saveHeatmapConfig(config: ActiveHoursConfig): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save heatmap config to localStorage:', error)
  }
}

/**
 * Clear heatmap configuration from localStorage.
 */
export function clearHeatmapConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear heatmap config from localStorage:', error)
  }
}

function isValidHour(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23
}

/**
 * Validate that stored configuration has the correct shape and value ranges.
 */
function validateStoredConfig(config: unknown): ActiveHoursConfig {
  if (!config || typeof config !== 'object') {
    return DEFAULT_ACTIVE_HOURS
  }

  const record = config as Record<string, unknown>

  if (!isValidHour(record.startHour) || !isValidHour(record.endHour) || typeof record.enabled !== 'boolean') {
    return DEFAULT_ACTIVE_HOURS
  }

  return { startHour: record.startHour, endHour: record.endHour, enabled: record.enabled }
}
