import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration, type PeriodCountFilter } from '@/shared/domain/filters/types'
import {
  getDataAwarePeriodCountOptions,
  getPeriodCountLabel,
  fallbackToValidOption,
} from '@/shared/domain/filters/period-count/period-count-logic'
import { countDataPeriods } from '@/shared/domain/filters/period-count/count-data-periods'
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
 * Prunes options based on actual data coverage using N+1 bucket rule.
 */
export function useIntervalSelector(
  duration: Duration,
  runs?: ParsedGameRun[]
): UseIntervalSelectorResult {
  const [intervalCount, setIntervalCountState] = useState<PeriodCountFilter>('all')

  const dataPeriodCount = useMemo(
    () => (runs ? countDataPeriods(runs, duration) : null),
    [runs, duration]
  )

  const countOptions = useMemo(
    () => getDataAwarePeriodCountOptions(duration, dataPeriodCount ?? Infinity),
    [duration, dataPeriodCount]
  )

  // Load persisted interval when duration or options change, with fallback
  useEffect(() => {
    const persisted = loadPersistedIntervalCount(duration)
    const value = persisted ?? 'all'
    const valid = fallbackToValidOption(value, countOptions)
    setIntervalCountState(valid)
    if (valid !== value) {
      savePersistedIntervalCount(duration, valid)
    }
  }, [duration, countOptions])

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
    countOptions,
    label: getPeriodCountLabel(duration),
  }
}
