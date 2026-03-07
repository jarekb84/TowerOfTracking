/**
 * Duration Filter Logic
 *
 * Pure functions for determining available duration options based on data.
 *
 * Architecture decisions for this module: see DECISIONS.md in this directory
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration, DURATION_LABELS } from '../types'
import { calculateDataSpan } from '../data-span'

/**
 * Determine which duration options should be available based on the data span
 *
 * Rules (aligned with PRD):
 * - Hourly & Per Run: Always available if runs exist
 * - Daily: Always available if runs exist (any amount of data supports daily)
 * - Weekly: Available if data spans more than 7 days
 * - Monthly: Available if data spans different calendar months
 * - Yearly: Available if data spans different calendar years
 */
export function getAvailableDurations(runs: ParsedGameRun[]): Duration[] {
  if (runs.length === 0) {
    return []
  }

  const available: Duration[] = [Duration.HOURLY, Duration.PER_RUN, Duration.DAILY]

  if (runs.length === 1) {
    return available
  }

  const span = calculateDataSpan(runs)
  if (!span) {
    return available
  }

  // Weekly: data spans more than 7 days
  if (span.daySpan > 7) {
    available.push(Duration.WEEKLY)
  }

  // Monthly: earliest and latest are in different calendar months
  if (span.spansDifferentMonths) {
    available.push(Duration.MONTHLY)
  }

  // Yearly: 2+ distinct calendar years
  if (span.spansDifferentYears) {
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
