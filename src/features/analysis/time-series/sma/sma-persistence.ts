import { isValidSmaOption, type SmaOption } from './sma-types'

const STORAGE_KEY = 'tower-tracking-sma-config'

interface SmaConfig {
  [metricKey: string]: SmaOption
}

/**
 * Load SMA option for a specific metric from localStorage
 * Returns 'none' as default if no stored value or on SSR
 */
export function loadSmaOption(metricKey: string): SmaOption {
  if (typeof window === 'undefined') return 'none'

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 'none'

    const config: SmaConfig = JSON.parse(stored)
    const value = config[metricKey]

    // Validate stored value is a valid SmaOption
    if (isValidSmaOption(value)) {
      return value
    }
    return 'none'
  } catch {
    return 'none'
  }
}

/**
 * Save SMA option for a specific metric to localStorage
 * Merges with existing config, SSR-safe
 */
export function saveSmaOption(metricKey: string, option: SmaOption): void {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const config: SmaConfig = stored ? JSON.parse(stored) : {}
    config[metricKey] = option
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save SMA config:', error)
  }
}

/**
 * Clear all SMA configurations from localStorage
 * Useful for testing or reset functionality
 */
export function clearSmaConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear SMA config:', error)
  }
}
