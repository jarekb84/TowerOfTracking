/**
 * Duration Filter Logic
 *
 * Pure functions for determining available duration options based on data.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration, DURATION_LABELS } from '../types'

/**
 * Valid duration string values for mapping from legacy enums
 */
const VALID_DURATION_VALUES = new Set<string>([
  'per-run', 'daily', 'weekly', 'monthly', 'yearly'
])

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
    return [Duration.PER_RUN]
  }

  const available: Duration[] = [Duration.PER_RUN]

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

/**
 * Type adapter: Convert a string value from a legacy duration enum to unified Duration
 *
 * This safely maps string values that match Duration enum values without
 * using unsafe type casts. Falls back to PER_RUN for invalid values.
 *
 * @param value - A string value from a legacy enum (e.g., SourceDuration, TrendsDuration)
 * @returns The corresponding Duration enum value
 */
export function stringToDuration(value: string): Duration {
  if (VALID_DURATION_VALUES.has(value)) {
    return value as Duration
  }
  return Duration.PER_RUN
}

/**
 * Type adapter: Convert Duration to a string for use with legacy duration enums
 *
 * Since Duration enum values are already strings matching legacy enum values,
 * this is a type-safe pass-through.
 *
 * @param duration - A Duration enum value
 * @returns The string value for use with legacy enums
 */
export function durationToString(duration: Duration): string {
  return duration
}
