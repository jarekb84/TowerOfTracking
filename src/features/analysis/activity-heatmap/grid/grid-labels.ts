/**
 * Grid Label Formatting
 *
 * Pure functions for generating locale-aware hour and day labels
 * used by the heatmap grid component.
 */

import { getDisplayLocale } from '@/shared/locale/locale-store'
import { isHourInActiveWindow } from '../calculations/heatmap-statistics'

/**
 * Format an hour (0-23) as a locale-aware time label.
 * Uses Intl.DateTimeFormat for consistent 12h/24h display.
 *
 * @example
 *   formatHourLabel(0)  // "12 AM" (en-US) or "00:00" (de-DE)
 *   formatHourLabel(14) // "2 PM" (en-US) or "14:00" (de-DE)
 */
export function formatHourLabel(hour: number): string {
  const date = new Date(2000, 0, 1, hour, 0, 0)
  return new Intl.DateTimeFormat(getDisplayLocale(), {
    hour: 'numeric',
  }).format(date)
}

/**
 * Format day header with weekday abbreviation and day-of-month.
 * Combines locale-aware weekday name with the numeric day.
 *
 * @param dayIndex - Grid column index (0=Sun, 6=Sat)
 * @param weekStart - The start date (Sunday) of the current week
 * @returns Formatted string like "Sun 22" (en-US) or "So 22." (de-DE)
 */
export function formatDayHeaderLabel(dayIndex: number, weekStart: Date): string {
  if (dayIndex < 0 || dayIndex > 6) return ''

  const date = new Date(weekStart)
  date.setDate(date.getDate() + dayIndex)

  return new Intl.DateTimeFormat(getDisplayLocale(), {
    weekday: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Checks whether a given hour falls within the active hours window.
 * Returns false when the active hours feature is disabled.
 * Delegates core logic to isHourInActiveWindow in the calculations layer.
 */
export function isHourActive(hour: number, startHour: number, endHour: number, enabled: boolean): boolean {
  if (!enabled) return false
  return isHourInActiveWindow(hour, startHour, endHour)
}

/**
 * Format an hour (0-23) as a user-friendly label for select dropdowns.
 * Includes minutes for explicit selection (e.g., "2:00 PM" or "14:00").
 *
 * @example
 *   formatHourOption(0)  // "12:00 AM" (en-US) or "00:00" (de-DE)
 *   formatHourOption(14) // "2:00 PM" (en-US) or "14:00" (de-DE)
 */
export function formatHourOption(hour: number): string {
  const date = new Date(2000, 0, 1, hour, 0, 0)
  return new Intl.DateTimeFormat(getDisplayLocale(), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
