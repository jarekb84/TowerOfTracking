import { isValidMovingAveragePeriod, type MovingAveragePeriod } from './moving-average-types'

const STORAGE_KEY = 'tower-tracking-moving-average-config'

interface MovingAverageConfig {
  [metricKey: string]: MovingAveragePeriod
}

/**
 * Load moving average period for a specific metric from localStorage
 * Returns 'none' as default if no stored value or on SSR
 */
export function loadMovingAveragePeriod(metricKey: string): MovingAveragePeriod {
  if (typeof window === 'undefined') return 'none'

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 'none'

    const config: MovingAverageConfig = JSON.parse(stored)
    const value = config[metricKey]

    // Validate stored value is a valid MovingAveragePeriod
    if (isValidMovingAveragePeriod(value)) {
      return value
    }
    return 'none'
  } catch {
    return 'none'
  }
}

/**
 * Save moving average period for a specific metric to localStorage
 * Merges with existing config, SSR-safe
 */
export function saveMovingAveragePeriod(metricKey: string, period: MovingAveragePeriod): void {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const config: MovingAverageConfig = stored ? JSON.parse(stored) : {}
    config[metricKey] = period
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save moving average config:', error)
  }
}

/**
 * Clear all moving average configurations from localStorage
 * Useful for testing or reset functionality
 */
export function clearMovingAverageConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear moving average config:', error)
  }
}
