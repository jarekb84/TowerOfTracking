import { useState, useEffect, useCallback } from 'react'
import { Duration, type PeriodCountFilter } from '@/shared/domain/filters/types'
import { getPeriodCountOptions, getPeriodCountLabel } from '@/shared/domain/filters/period-count/period-count-logic'
import {
  loadPersistedIntervalCount,
  savePersistedIntervalCount,
} from './interval-persistence'

interface UseIntervalSelectorResult {
  intervalCount: PeriodCountFilter
  setIntervalCount: (count: PeriodCountFilter) => void
  countOptions: number[]
  label: string
}

/**
 * Hook to manage interval count state with localStorage persistence.
 * Loads persisted value on duration change, falls back to 'all'.
 */
export function useIntervalSelector(duration: Duration): UseIntervalSelectorResult {
  const [intervalCount, setIntervalCountState] = useState<PeriodCountFilter>('all')

  // Load persisted interval when duration changes
  useEffect(() => {
    const persisted = loadPersistedIntervalCount(duration)
    setIntervalCountState(persisted ?? 'all')
  }, [duration])

  const setIntervalCount = useCallback(
    (count: PeriodCountFilter) => {
      setIntervalCountState(count)
      savePersistedIntervalCount(duration, count)
    },
    [duration]
  )

  return {
    intervalCount,
    setIntervalCount,
    countOptions: getPeriodCountOptions(duration),
    label: getPeriodCountLabel(duration),
  }
}
