/**
 * usePeriodCountOptions Hook
 *
 * React hook for generating period count options based on duration.
 * Supports optional data-aware pruning when runs are provided.
 *
 * Architecture decisions for this module: see DECISIONS.md in this directory
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import type { PeriodCountOverrides } from './period-count-logic'
import {
  getPeriodCountOptions,
  getDataAwarePeriodCountOptions,
  getDefaultPeriodCount,
  getPeriodCountLabel,
  adjustPeriodCountForDuration,
  fallbackToValidOption
} from './period-count-logic'
import { countDataPeriods } from './count-data-periods'

interface UsePeriodCountOptionsResult {
  /** Available period count options for current duration */
  options: number[]
  /** Default count for current duration */
  defaultCount: number
  /** Label for the selector (e.g., "Last Days") */
  label: string
  /** Adjust a period count when duration changes */
  adjustForDuration: (count: number | 'all') => number | 'all'
  /** Fall back to valid option if current selection was pruned */
  ensureValidOption: (count: number | 'all') => number | 'all'
}

/**
 * Hook to get period count options for a given duration.
 * When runs are provided, options are pruned using the N+1 bucket rule.
 */
export function usePeriodCountOptions(
  duration: Duration,
  overrides?: PeriodCountOverrides,
  runs?: ParsedGameRun[]
): UsePeriodCountOptionsResult {
  const dataPeriodCount = useMemo(
    () => (runs ? countDataPeriods(runs, duration) : null),
    [runs, duration]
  )

  const options = useMemo(() => {
    if (dataPeriodCount !== null) {
      return getDataAwarePeriodCountOptions(duration, dataPeriodCount, overrides)
    }
    return getPeriodCountOptions(duration, overrides)
  }, [duration, overrides, dataPeriodCount])

  const defaultCount = useMemo(() => getDefaultPeriodCount(duration, overrides), [duration, overrides])

  const label = useMemo(() => getPeriodCountLabel(duration), [duration])

  const adjustForDuration = useMemo(
    () => (count: number | 'all') => adjustPeriodCountForDuration(count, duration, overrides),
    [duration, overrides]
  )

  const ensureValidOption = useMemo(
    () => (count: number | 'all') => fallbackToValidOption(count, options),
    [options]
  )

  return { options, defaultCount, label, adjustForDuration, ensureValidOption }
}
