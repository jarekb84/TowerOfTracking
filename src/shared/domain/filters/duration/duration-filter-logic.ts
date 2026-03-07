/**
 * Duration Filter Logic
 *
 * Pure functions for determining available duration options based on data.
 *
 * Architecture decisions for this module: see DECISIONS.md in this directory
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration, DURATION_LABELS } from '../types'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Determine which duration options should be available based on the data span
 *
 * Rules:
 * - Per Run: Always available if runs exist
 * - Daily: Available if data spans at least 2 days
 * - Weekly: Available if data spans at least 2 weeks
 * - Monthly: Available if data spans at least 2 months
 * - Yearly: Available if data spans multiple years
 */
export function getAvailableDurations(runs: ParsedGameRun[]): Duration[] {
  if (runs.length === 0) {
    return []
  }

  if (runs.length === 1) {
    return [Duration.HOURLY, Duration.PER_RUN]
  }

  const available: Duration[] = [Duration.HOURLY, Duration.PER_RUN]

  // Find date range from runs
  const dates = runs
    .map(run => run.timestamp)
    .filter((date): date is Date => date instanceof Date && !isNaN(date.getTime()))

  if (dates.length < 2) {
    return available
  }

  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
  const earliest = sortedDates[0]
  const latest = sortedDates[sortedDates.length - 1]

  const daySpan = Math.floor((latest.getTime() - earliest.getTime()) / MILLISECONDS_PER_DAY)

  // Daily requires at least 2 different days
  if (daySpan >= 1) {
    available.push(Duration.DAILY)
  }

  // Weekly requires at least 2 weeks of data (14 days)
  if (daySpan >= 14) {
    available.push(Duration.WEEKLY)
  }

  // Monthly requires at least 2 months of data (60 days as approximation)
  if (daySpan >= 60) {
    available.push(Duration.MONTHLY)
  }

  // Yearly requires data spanning multiple calendar years
  // Use UTC year to avoid timezone issues
  if (earliest.getUTCFullYear() !== latest.getUTCFullYear()) {
    available.push(Duration.YEARLY)
  }

  return available
}

/**
 * Check if a specific duration should be available
 */
export function isDurationAvailable(
  duration: Duration,
  availableDurations: Duration[]
): boolean {
  return availableDurations.includes(duration)
}

/**
 * Get the display label for a duration
 */
export function getDurationLabel(duration: Duration): string {
  return DURATION_LABELS[duration]
}

/**
 * Get the closest available duration if the requested one isn't available
 * Falls back to Per Run if nothing else is available
 */
export function getClosestAvailableDuration(
  requested: Duration,
  available: Duration[]
): Duration {
  if (available.includes(requested)) {
    return requested
  }

  // Order of preference for fallback
  const preferenceOrder: Duration[] = [
    Duration.HOURLY,
    Duration.PER_RUN,
    Duration.DAILY,
    Duration.WEEKLY,
    Duration.MONTHLY,
    Duration.YEARLY
  ]

  for (const duration of preferenceOrder) {
    if (available.includes(duration)) {
      return duration
    }
  }

  return Duration.PER_RUN
}

