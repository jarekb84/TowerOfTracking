/**
 * Count Data Periods
 *
 * Pure function for counting how many distinct periods of a given
 * duration type the user's data covers. Used by data-aware pruning
 * to determine which interval count options are meaningful.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'

/**
 * Get a period key for grouping purposes.
 * Simplified version focused on counting unique periods.
 */
function getPeriodKeyForCounting(timestamp: Date, duration: Duration): string {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  switch (duration) {
    case Duration.HOURLY:
      return `${year}-${month}-${day}T${String(d.getHours()).padStart(2, '0')}`
    case Duration.PER_RUN:
      return d.toISOString()
    case Duration.DAILY:
      return `${year}-${month}-${day}`
    case Duration.WEEKLY: {
      // Get Sunday of this week
      const dayOfWeek = d.getDay()
      const sunday = new Date(d)
      sunday.setDate(d.getDate() - dayOfWeek)
      const sy = sunday.getFullYear()
      const sm = String(sunday.getMonth() + 1).padStart(2, '0')
      const sd = String(sunday.getDate()).padStart(2, '0')
      return `${sy}-${sm}-${sd}`
    }
    case Duration.MONTHLY:
      return `${year}-${month}`
    case Duration.YEARLY:
      return `${year}`
    default:
      return d.toISOString()
  }
}

/**
 * Count the number of distinct periods in the data for a given duration.
 */
export function countDataPeriods(runs: ParsedGameRun[], duration: Duration): number {
  if (runs.length === 0) {
    return 0
  }

  const uniquePeriods = new Set<string>()

  for (const run of runs) {
    if (run.timestamp instanceof Date && !isNaN(run.timestamp.getTime())) {
      uniquePeriods.add(getPeriodKeyForCounting(run.timestamp, duration))
    }
  }

  return uniquePeriods.size
}
