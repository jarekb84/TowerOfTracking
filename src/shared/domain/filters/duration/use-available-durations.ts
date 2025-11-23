/**
 * useAvailableDurations Hook
 *
 * React hook for determining which duration options should be available
 * based on the data span of the runs.
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import {
  getAvailableDurations,
  isDurationAvailable,
  getClosestAvailableDuration
} from './duration-filter-logic'

interface UseAvailableDurationsResult {
  /** Available duration options based on data span */
  durations: Duration[]
  /** Check if a specific duration is available */
  isAvailable: (duration: Duration) => boolean
  /** Get the closest available duration if requested isn't available */
  getClosest: (duration: Duration) => Duration
}

/**
 * Hook to calculate available duration options based on data span
 *
 * @param runs - Array of parsed game runs
 * @returns Object containing available durations and helper functions
 */
export function useAvailableDurations(
  runs: ParsedGameRun[]
): UseAvailableDurationsResult {
  const durations = useMemo(() => getAvailableDurations(runs), [runs])

  const isAvailable = useMemo(
    () => (duration: Duration) => isDurationAvailable(duration, durations),
    [durations]
  )

  const getClosest = useMemo(
    () => (duration: Duration) => getClosestAvailableDuration(duration, durations),
    [durations]
  )

  return { durations, isAvailable, getClosest }
}
