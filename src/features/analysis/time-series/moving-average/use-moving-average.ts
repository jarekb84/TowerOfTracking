import { useState, useEffect, useCallback } from 'react'
import type { MovingAveragePeriod } from './moving-average-types'
import { loadMovingAveragePeriod, saveMovingAveragePeriod } from './moving-average-persistence'

interface UseMovingAverageResult {
  /** Current moving average period ('none' or window size) */
  averagePeriod: MovingAveragePeriod
  /** Update moving average period (persists to localStorage) */
  setAveragePeriod: (period: MovingAveragePeriod) => void
  /** Whether moving average is enabled (not 'none') */
  isAverageEnabled: boolean
}

/**
 * Hook to manage moving average state with localStorage persistence.
 * Loads persisted value on mount and saves changes automatically.
 *
 * @param metricKey - Unique key to identify this chart's moving average setting
 * @returns Moving average state and setter function
 */
export function useMovingAverage(metricKey: string): UseMovingAverageResult {
  const [averagePeriod, setAveragePeriodState] = useState<MovingAveragePeriod>('none')

  // Load persisted moving average period on mount (SSR-safe)
  useEffect(() => {
    const savedPeriod = loadMovingAveragePeriod(metricKey)
    setAveragePeriodState(savedPeriod)
  }, [metricKey])

  // Handle moving average period change with persistence
  const setAveragePeriod = useCallback((period: MovingAveragePeriod) => {
    setAveragePeriodState(period)
    saveMovingAveragePeriod(metricKey, period)
  }, [metricKey])

  return {
    averagePeriod,
    setAveragePeriod,
    isAverageEnabled: averagePeriod !== 'none',
  }
}
