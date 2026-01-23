import { useState, useEffect, useCallback } from 'react'
import type { TimePeriod } from '../chart-types'
import type { TrendWindowValue } from './moving-average-types'
import { getWindowSize } from './moving-average-types'
import { loadTrendWindow, saveTrendWindow } from './moving-average-persistence'

interface UseMovingAverageResult {
  /** Current trend window value ('none' or period-specific string like '7d') */
  trendWindow: TrendWindowValue
  /** Update trend window value (persists to localStorage) */
  setTrendWindow: (value: TrendWindowValue) => void
  /** Numeric window size for calculation, null when 'none' */
  windowSize: number | null
  /** Whether trend line is enabled (not 'none') */
  isEnabled: boolean
}

/**
 * Hook to manage trend window state with localStorage persistence.
 * Loads persisted value on mount and saves changes automatically.
 * Values are stored per metric + period combination.
 *
 * @param metricKey - Unique key to identify this chart's metric
 * @param period - Current time period for the chart
 * @returns Trend window state and setter function
 */
export function useMovingAverage(
  metricKey: string,
  period: TimePeriod
): UseMovingAverageResult {
  const [trendWindow, setTrendWindowState] = useState<TrendWindowValue>('none')

  // Load persisted trend window on mount and when metric/period changes (SSR-safe)
  useEffect(() => {
    const savedValue = loadTrendWindow(metricKey, period)
    setTrendWindowState(savedValue)
  }, [metricKey, period])

  // Handle trend window change with persistence
  const setTrendWindow = useCallback(
    (value: TrendWindowValue) => {
      setTrendWindowState(value)
      saveTrendWindow(metricKey, period, value)
    },
    [metricKey, period]
  )

  return {
    trendWindow,
    setTrendWindow,
    windowSize: getWindowSize(trendWindow),
    isEnabled: trendWindow !== 'none',
  }
}
