import { useEffect, useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration, type PeriodCountFilter } from '@/shared/domain/filters/types'
import {
  getDataAwarePeriodCountOptions,
  getPeriodCountLabel,
  fallbackToValidOption,
} from '@/shared/domain/filters/period-count/period-count-logic'
import { countDataPeriods } from '@/shared/domain/filters/period-count/count-data-periods'
import { usePersistedPageState, loadPageValue } from '@/shared/persistence'

interface UseIntervalSelectorResult {
  intervalCount: PeriodCountFilter
  setIntervalCount: (count: PeriodCountFilter) => void
  countOptions: number[]
  label: string
}

/**
 * Hook to manage interval count state with page-scoped localStorage persistence.
 * Prunes options based on actual data coverage using N+1 bucket rule.
 */
export function useIntervalSelector(
  duration: Duration,
  runs: ParsedGameRun[] | undefined,
  pageScope: string
): UseIntervalSelectorResult {
  const storageKey = `intervalCount:${duration}`

  const [intervalCount, setIntervalCount] = usePersistedPageState<PeriodCountFilter>(
    pageScope, storageKey, 'all'
  )

  const dataPeriodCount = useMemo(
    () => (runs ? countDataPeriods(runs, duration) : null),
    [runs, duration]
  )

  const countOptions = useMemo(
    () => getDataAwarePeriodCountOptions(duration, dataPeriodCount ?? Infinity),
    [duration, dataPeriodCount]
  )

  // Load-and-validate: read stored value directly to avoid stale-state race
  // between usePersistedPageState hydration and this validation effect
  useEffect(() => {
    const stored = loadPageValue<PeriodCountFilter>(pageScope, storageKey, 'all')
    const valid = fallbackToValidOption(stored, countOptions)
    setIntervalCount(valid)
  }, [pageScope, storageKey, countOptions, setIntervalCount])

  return {
    intervalCount,
    setIntervalCount,
    countOptions,
    label: getPeriodCountLabel(duration),
  }
}
