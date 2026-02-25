/**
 * Week Utility Functions
 *
 * Pure functions for Sunday-based week date math used by the activity heatmap.
 * All functions operate in local time (not UTC).
 *
 * Week definition: Sunday (dayIndex 0) through Saturday (dayIndex 6).
 */

/**
 * Returns Sunday 00:00:00.000 of the week containing the given date.
 * Uses local time.
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date)
  const daysSinceSunday = result.getDay() // 0=Sun already means 0 days back
  result.setDate(result.getDate() - daysSinceSunday)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Returns Saturday 23:59:59.999 of the week starting at the given Sunday.
 */
export function getWeekEnd(weekStart: Date): Date {
  const result = new Date(weekStart)
  result.setDate(result.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Returns the Sunday of the next week (weekStart + 7 days).
 */
export function getNextWeekStart(weekStart: Date): Date {
  const result = new Date(weekStart)
  result.setDate(result.getDate() + 7)
  return result
}

/**
 * Returns the Sunday of the previous week (weekStart - 7 days).
 */
export function getPrevWeekStart(weekStart: Date): Date {
  const result = new Date(weekStart)
  result.setDate(result.getDate() - 7)
  return result
}

/**
 * Returns whether two dates fall within the same Sunday-through-Saturday week.
 */
export function isSameWeek(a: Date, b: Date): boolean {
  const weekA = getWeekStart(a)
  const weekB = getWeekStart(b)
  return (
    weekA.getFullYear() === weekB.getFullYear() &&
    weekA.getMonth() === weekB.getMonth() &&
    weekA.getDate() === weekB.getDate()
  )
}

/**
 * Converts JS `getDay()` (0=Sun, ..., 6=Sat) to our heatmap index
 * (0=Sun, 1=Mon, ..., 6=Sat).
 * Since JS getDay() already uses Sunday=0, this is an identity mapping.
 */
export function getDayIndex(date: Date): number {
  return date.getDay()
}
