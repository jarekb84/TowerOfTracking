import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { subDays } from 'date-fns'

/**
 * Union type for all date range filter values.
 * Date-based options filter by timestamp; count-based options take the first N runs.
 */
export type DateRange = 'all' | 'last-7d' | 'last-30d' | 'last-90d' | 'last-25r' | 'last-50r' | 'last-100r'

interface DateRangeOption {
  readonly value: DateRange
  readonly label: string
  readonly group: 'date' | 'runs'
}

export const DATE_RANGE_OPTIONS: readonly DateRangeOption[] = [
  { value: 'all', label: 'All', group: 'date' },
  { value: 'last-7d', label: 'Last 7 Days', group: 'date' },
  { value: 'last-30d', label: 'Last 30 Days', group: 'date' },
  { value: 'last-90d', label: 'Last 90 Days', group: 'date' },
  { value: 'last-25r', label: 'Last 25 Runs', group: 'runs' },
  { value: 'last-50r', label: 'Last 50 Runs', group: 'runs' },
  { value: 'last-100r', label: 'Last 100 Runs', group: 'runs' },
] as const

/** Extract the numeric value from a DateRange string (e.g. 'last-7d' -> 7, 'last-25r' -> 25). */
function parseRangeValue(range: DateRange): number {
  return parseInt(range.replace(/^last-/, '').replace(/[dr]$/, ''), 10)
}

/** Return runs within the last N days. */
function filterByDays(runs: readonly ParsedGameRun[], days: number): ParsedGameRun[] {
  const cutoff = subDays(new Date(), days)
  return runs.filter((run) => run.timestamp >= cutoff)
}

/**
 * Count how many runs match a given date range option.
 * Runs are assumed to be sorted descending (newest first).
 */
export function countRunsForOption(runs: readonly ParsedGameRun[], option: DateRangeOption): number {
  if (option.value === 'all') return runs.length

  if (option.group === 'runs') {
    return Math.min(runs.length, parseRangeValue(option.value))
  }

  return filterByDays(runs, parseRangeValue(option.value)).length
}

/**
 * Filter runs by a date range value.
 * Runs are assumed to be sorted descending (newest first).
 */
export function filterRunsByDateRange(
  runs: readonly ParsedGameRun[],
  dateRange: DateRange
): ParsedGameRun[] {
  if (dateRange === 'all') return [...runs]

  // Count-based: take first N runs (newest first)
  if (dateRange.endsWith('r')) {
    return runs.slice(0, parseRangeValue(dateRange))
  }

  // Date-based: filter by timestamp
  return filterByDays(runs, parseRangeValue(dateRange))
}
