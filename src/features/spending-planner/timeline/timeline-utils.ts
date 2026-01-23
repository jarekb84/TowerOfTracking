/**
 * Timeline Utilities
 *
 * Helper functions for timeline date calculations and formatting.
 */

import { formatDisplayMonthDay } from '@/shared/formatting/date-formatters'

/**
 * Generate an array of week start dates for the timeline.
 *
 * @param startDate - Starting date (week 0)
 * @param weeks - Number of weeks to generate
 */
export function generateWeekDates(startDate: Date, weeks: number): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < weeks; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i * 7)
    dates.push(date)
  }
  return dates
}

/**
 * Get the number of days between two dates.
 */
export function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date falls within a week range.
 *
 * @param date - Date to check
 * @param weekStart - Start of the week
 * @returns true if date is within the 7-day week starting at weekStart
 */
export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  return date >= weekStart && date < weekEnd
}

/**
 * Calculate how many weeks an event spans.
 *
 * @param durationDays - Duration in days
 * @returns Number of weeks (rounded up)
 */
export function durationToWeeks(durationDays: number): number {
  return Math.ceil(durationDays / 7)
}

/**
 * Get start of week (Sunday) for a given date.
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  // Adjust to Sunday (day 0)
  result.setDate(result.getDate() - day)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Calculate the number of days remaining in the current week, including today.
 * Week runs Sunday (0) through Saturday (6).
 *
 * @param date - The current date
 * @returns Number of days remaining (1-7)
 */
export function getDaysRemainingInWeek(date: Date): number {
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  // Days remaining including today: Saturday (6) - current day + 1
  // Simplified: 7 - dayOfWeek
  return 7 - dayOfWeek
}

/**
 * Calculate the proration factor for the current week's income.
 * Based on how many days remain in the week (including today).
 *
 * @param date - The current date
 * @returns Proration factor (0 < factor <= 1)
 */
export function getCurrentWeekProrationFactor(date: Date): number {
  const daysRemaining = getDaysRemainingInWeek(date)
  return daysRemaining / 7
}

/**
 * Format a date range for display.
 */
export function formatDateRange(start: Date, end: Date): string {
  return `${formatDisplayMonthDay(start)} - ${formatDisplayMonthDay(end)}`
}
