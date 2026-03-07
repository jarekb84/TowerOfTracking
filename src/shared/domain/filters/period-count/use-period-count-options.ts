/**
 * usePeriodCountOptions Hook
 *
 * React hook for generating period count options based on duration.
 *
 * Architecture decisions for this module: see DECISIONS.md in this directory
 */

import { useMemo } from 'react'
import { Duration } from '../types'
import type { PeriodCountOverrides } from './period-count-logic'
import {
  getPeriodCountOptions,
  getDefaultPeriodCount,
  getPeriodCountLabel,
  adjustPeriodCountForDuration
} from './period-count-logic'

interface UsePeriodCountOptionsResult {
  /** Available period count options for current duration */
  options: number[]
  /** Default count for current duration */
  defaultCount: number
  /** Label for the selector (e.g., "Last Days") */
  label: string
  /** Adjust a period count when duration changes */
  adjustForDuration: (count: number | 'all') => number | 'all'
}

/**
 * Hook to get period count options for a given duration
 *
 * @param duration - Current duration selection
 * @returns Object containing options, default, label, and adjustment function
 */
export function usePeriodCountOptions(
  duration: Duration,
  overrides?: PeriodCountOverrides
): UsePeriodCountOptionsResult {
  const options = useMemo(() => getPeriodCountOptions(duration, overrides), [duration, overrides])

  const defaultCount = useMemo(() => getDefaultPeriodCount(duration, overrides), [duration, overrides])

  const label = useMemo(() => getPeriodCountLabel(duration), [duration])

  const adjustForDuration = useMemo(
    () => (count: number | 'all') => adjustPeriodCountForDuration(count, duration, overrides),
    [duration, overrides]
  )

  return { options, defaultCount, label, adjustForDuration }
}
