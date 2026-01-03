const STORAGE_KEY = 'tower-tracking-percent-change-config'

interface PercentChangeConfig {
  [metricKey: string]: boolean
}

/**
 * Load percent change toggle state for a specific metric from localStorage.
 * Returns false as default if no stored value or on SSR.
 */
export function loadPercentChangeEnabled(metricKey: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return false

    const config: PercentChangeConfig = JSON.parse(stored)
    return config[metricKey] === true
  } catch {
    return false
  }
}

/**
 * Save percent change toggle state for a specific metric to localStorage.
 * Merges with existing config, SSR-safe.
 */
export function savePercentChangeEnabled(
  metricKey: string,
  enabled: boolean
): void {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const config: PercentChangeConfig = stored ? JSON.parse(stored) : {}
    config[metricKey] = enabled
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save percent change config:', error)
  }
}
