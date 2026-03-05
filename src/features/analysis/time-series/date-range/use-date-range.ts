import { useState, useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { type DateRange, filterRunsByDateRange } from './date-range-types'

interface UseDateRangeResult {
  dateRange: DateRange
  setDateRange: (value: DateRange) => void
  filteredRuns: ParsedGameRun[]
}

/**
 * Hook to manage date range filtering state.
 * Filters runs by the selected date range and returns the filtered result.
 *
 * @param runs - Runs to filter (already type-filtered, sorted descending)
 * @returns Date range state and filtered runs
 */
export function useDateRange(runs: readonly ParsedGameRun[]): UseDateRangeResult {
  const [dateRange, setDateRange] = useState<DateRange>('all')

  const filteredRuns = useMemo(
    () => filterRunsByDateRange(runs, dateRange),
    [runs, dateRange]
  )

  return { dateRange, setDateRange, filteredRuns }
}
