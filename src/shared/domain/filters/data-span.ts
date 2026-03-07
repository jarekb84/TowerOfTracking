/**
 * Data Span Calculation
 *
 * Pure functions for calculating the temporal span of game run data.
 * Used by duration filtering and period count pruning to determine
 * which options are meaningful for the user's actual data.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

interface DataSpan {
  earliest: Date
  latest: Date
  daySpan: number
  spansDifferentMonths: boolean
  spansDifferentYears: boolean
}

/**
 * Calculate the temporal span of a set of game runs.
 * Returns null for empty arrays or arrays with fewer than 2 valid timestamps.
 */
export function calculateDataSpan(runs: ParsedGameRun[]): DataSpan | null {
  const dates = runs
    .map(run => run.timestamp)
    .filter((date): date is Date => date instanceof Date && !isNaN(date.getTime()))

  if (dates.length < 2) {
    return null
  }

  let earliest = dates[0]
  let latest = dates[0]

  for (const date of dates) {
    if (date.getTime() < earliest.getTime()) earliest = date
    if (date.getTime() > latest.getTime()) latest = date
  }

  const daySpan = Math.floor((latest.getTime() - earliest.getTime()) / MILLISECONDS_PER_DAY)

  const spansDifferentMonths =
    earliest.getUTCFullYear() !== latest.getUTCFullYear() ||
    earliest.getUTCMonth() !== latest.getUTCMonth()

  const spansDifferentYears =
    earliest.getUTCFullYear() !== latest.getUTCFullYear()

  return { earliest, latest, daySpan, spansDifferentMonths, spansDifferentYears }
}
