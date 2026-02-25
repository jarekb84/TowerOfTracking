/**
 * Week Navigation
 *
 * Pure functions for navigating between weeks based on available game run data.
 * Used by the activity heatmap to determine which weeks contain runs and to
 * support prev/next navigation controls.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { WeekInfo } from '../types'
import { getWeekStart, getWeekEnd, isSameWeek } from '../week-utils'
import { getRunTimeRange, clipRunToWeek } from '../calculations/heatmap-grid-builder'
import { formatWeekOfLabel } from '@/shared/formatting/date-formatters'

/**
 * Scans all runs and returns WeekInfo[] covering every week from the earliest
 * to the latest run. Newest week first.
 *
 * Uses each run's start time (derived from timestamp minus duration) to
 * determine which week it belongs to. Also includes weeks for run end times
 * to cover runs that span week boundaries.
 *
 * @param runs - All parsed game runs
 * @returns Array of WeekInfo objects, newest first. Empty if no runs.
 */
export function deriveAvailableWeeks(runs: ParsedGameRun[]): WeekInfo[] {
  if (runs.length === 0) return []

  const weekStarts = new Map<string, Date>()

  for (const run of runs) {
    const { start, end } = getRunTimeRange(run)

    // Add the week containing the run start
    const startWeek = getWeekStart(start)
    const startKey = startWeek.getTime().toString()
    if (!weekStarts.has(startKey)) {
      weekStarts.set(startKey, startWeek)
    }

    // Add the week containing the run end (handles week-boundary spans)
    const endWeek = getWeekStart(end)
    const endKey = endWeek.getTime().toString()
    if (!weekStarts.has(endKey)) {
      weekStarts.set(endKey, endWeek)
    }
  }

  // Sort by date descending (newest first)
  const sortedWeeks = Array.from(weekStarts.values()).sort(
    (a, b) => b.getTime() - a.getTime()
  )

  return sortedWeeks.map((weekStart) => ({
    weekStart,
    weekLabel: formatWeekOfLabel(weekStart),
  }))
}

/**
 * Returns the most recent week (first in the array), or null if empty.
 *
 * @param availableWeeks - Array of WeekInfo, expected newest first
 * @returns The most recent WeekInfo, or null if the array is empty
 */
export function getDefaultWeek(availableWeeks: WeekInfo[]): WeekInfo | null {
  return availableWeeks.length > 0 ? availableWeeks[0] : null
}

/**
 * Returns true if there is a newer week available than the current one.
 *
 * @param currentWeek - The Sunday date of the currently selected week
 * @param availableWeeks - Array of WeekInfo, expected newest first
 * @returns True if navigation to a newer week is possible
 */
export function canNavigateNext(currentWeek: Date, availableWeeks: WeekInfo[]): boolean {
  if (availableWeeks.length === 0) return false

  // The newest week is the first element; if current is already the newest, can't go next
  return !isSameWeek(currentWeek, availableWeeks[0].weekStart)
}

/**
 * Returns true if there is an older week available than the current one.
 *
 * @param currentWeek - The Sunday date of the currently selected week
 * @param availableWeeks - Array of WeekInfo, expected newest first
 * @returns True if navigation to an older week is possible
 */
export function canNavigatePrev(currentWeek: Date, availableWeeks: WeekInfo[]): boolean {
  if (availableWeeks.length === 0) return false

  // The oldest week is the last element; if current is already the oldest, can't go prev
  const lastWeek = availableWeeks[availableWeeks.length - 1]
  return !isSameWeek(currentWeek, lastWeek.weekStart)
}

/**
 * Returns runs whose time range overlaps the given week.
 *
 * Uses clipRunToWeek to determine overlap: if the clipped result is non-null,
 * the run overlaps the week and is included.
 *
 * @param runs - All parsed game runs
 * @param weekStart - Sunday 00:00:00.000 of the target week
 * @returns Runs that overlap the given week
 */
export function getRunsForWeek(runs: ParsedGameRun[], weekStart: Date): ParsedGameRun[] {
  const weekEnd = getWeekEnd(weekStart)

  return runs.filter((run) => {
    const { start, end } = getRunTimeRange(run)
    return clipRunToWeek(start, end, weekStart, weekEnd) !== null
  })
}
