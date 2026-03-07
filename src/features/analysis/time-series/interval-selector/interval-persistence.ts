import { Duration, type PeriodCountFilter } from '@/shared/domain/filters/types'

const STORAGE_KEY = 'tower-tracking-time-series-filters'

interface TimeSeriesFilterConfig {
  duration?: string
  periodCounts?: Record<string, number | 'all'>
}

function loadConfig(): TimeSeriesFilterConfig {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored) as TimeSeriesFilterConfig
  } catch {
    return {}
  }
}

function saveConfig(config: TimeSeriesFilterConfig): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Silently fail on storage errors
  }
}

/**
 * Load persisted duration from localStorage.
 * Returns null if no stored value or on SSR.
 */
export function loadPersistedDuration(): Duration | null {
  const config = loadConfig()
  const value = config.duration

  if (value && Object.values(Duration).includes(value as Duration)) {
    return value as Duration
  }

  return null
}

/**
 * Save duration selection to localStorage.
 */
export function savePersistedDuration(duration: Duration): void {
  if (typeof window === 'undefined') return

  const config = loadConfig()
  config.duration = duration
  saveConfig(config)
}

/**
 * Load persisted interval count for a specific duration.
 * Returns null if no stored value.
 */
export function loadPersistedIntervalCount(duration: Duration): PeriodCountFilter | null {
  const config = loadConfig()
  const counts = config.periodCounts

  if (!counts || !(duration in counts)) return null

  const value = counts[duration]
  if (value === 'all' || (typeof value === 'number' && value > 0)) {
    return value
  }

  return null
}

/**
 * Save interval count for a specific duration to localStorage.
 */
export function savePersistedIntervalCount(
  duration: Duration,
  count: PeriodCountFilter
): void {
  if (typeof window === 'undefined') return

  const config = loadConfig()
  if (!config.periodCounts) {
    config.periodCounts = {}
  }
  config.periodCounts[duration] = count
  saveConfig(config)
}

/**
 * Clear all time series filter config from localStorage.
 */
export function clearTimeSeriesFilterConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail
  }
}
