import type { TimePeriod } from '../chart-types'
import {
  isValidTrendWindowValue,
  getDefaultTrendWindow,
  type TrendWindowValue,
} from './moving-average-types'

const STORAGE_KEY = 'tower-tracking-moving-average-config'

interface TrendWindowConfig {
  [compoundKey: string]: TrendWindowValue
}

/**
 * Build compound key from metric and period.
 * Format: "metricKey:period" (e.g., "coinsEarned:daily")
 */
export function buildCompoundKey(metricKey: string, period: TimePeriod): string {
  return `${metricKey}:${period}`
}

/**
 * Check if stored config is in legacy format (bare numbers like 3, 5, 10).
 * Legacy format: { "coinsEarned": 5, "totalDamage": 3 }
 * New format: { "coinsEarned:daily": "7d", "totalDamage:weekly": "2w" }
 */
function isLegacyFormat(config: unknown): boolean {
  if (!config || typeof config !== 'object') return false

  return Object.values(config).some(
    (value) => typeof value === 'number' && [3, 5, 10].includes(value)
  )
}

/**
 * Load stored config, migrating from legacy format if needed.
 * Returns empty object if legacy format detected (migration clears old data).
 */
function loadConfig(): TrendWindowConfig {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const config = JSON.parse(stored)

    // Detect and clear legacy format
    if (isLegacyFormat(config)) {
      localStorage.removeItem(STORAGE_KEY)
      return {}
    }

    return config as TrendWindowConfig
  } catch {
    return {}
  }
}

/**
 * Save config to localStorage
 */
function saveConfig(config: TrendWindowConfig): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save trend window config:', error)
  }
}

/**
 * Load trend window value for a specific metric and period from localStorage.
 * Returns 'none' as default if no stored value or on SSR.
 */
export function loadTrendWindow(metricKey: string, period: TimePeriod): TrendWindowValue {
  const config = loadConfig()
  const compoundKey = buildCompoundKey(metricKey, period)
  const value = config[compoundKey]

  // Validate stored value is a valid TrendWindowValue
  if (isValidTrendWindowValue(value)) {
    return value
  }

  return getDefaultTrendWindow()
}

/**
 * Save trend window value for a specific metric and period to localStorage.
 * Merges with existing config, SSR-safe.
 */
export function saveTrendWindow(
  metricKey: string,
  period: TimePeriod,
  value: TrendWindowValue
): void {
  if (typeof window === 'undefined') return

  const config = loadConfig()
  const compoundKey = buildCompoundKey(metricKey, period)
  config[compoundKey] = value
  saveConfig(config)
}

/**
 * Clear all trend window configurations from localStorage.
 * Useful for testing or reset functionality.
 */
export function clearTrendWindowConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear trend window config:', error)
  }
}

