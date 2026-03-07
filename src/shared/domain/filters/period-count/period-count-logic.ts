/**
 * Period Count Logic
 *
 * Pure functions for generating period count options based on duration.
 *
 * Architecture decisions for this module: see DECISIONS.md in this directory
 */

import { Duration, PERIOD_UNIT_LABELS } from '../types'

/**
 * Custom period count overrides for consumers with layout-specific needs.
 * Table-based layouts need smaller values (2-7 columns) vs chart-based defaults.
 */
export type PeriodCountOverrides = Partial<Record<Duration, number[]>>

/**
 * Period count increment configurations by duration
 *
 * Per Run: Standard increments (5, 10, 15, 20, 25, 30)
 * Daily: Weekly cycles (7, 14, 21, 28, 35, 42)
 * Weekly: Standard increments (5, 10, 15, 20, 25, 30)
 * Monthly: Quarterly-aligned (3, 6, 9, 12)
 * Yearly: Small increments (2, 3, 4, 5)
 */
const PERIOD_COUNT_OPTIONS: Record<Duration, number[]> = {
  [Duration.HOURLY]: [6, 12, 18, 24, 30, 36],
  [Duration.PER_RUN]: [5, 10, 15, 20, 25, 30],
  [Duration.DAILY]: [7, 14, 21, 28, 35, 42],
  [Duration.WEEKLY]: [5, 10, 15, 20, 25, 30],
  [Duration.MONTHLY]: [3, 6, 9, 12],
  [Duration.YEARLY]: [2, 3, 4, 5]
}

/**
 * Default period counts per duration
 */
const DEFAULT_PERIOD_COUNTS: Record<Duration, number> = {
  [Duration.HOURLY]: 12,
  [Duration.PER_RUN]: 10,
  [Duration.DAILY]: 14,
  [Duration.WEEKLY]: 10,
  [Duration.MONTHLY]: 6,
  [Duration.YEARLY]: 3
}

/**
 * Get period count options for a given duration
 */
export function getPeriodCountOptions(
  duration: Duration,
  overrides?: PeriodCountOverrides
): number[] {
  return overrides?.[duration] ?? PERIOD_COUNT_OPTIONS[duration]
}

/**
 * Get the default period count for a duration
 */
export function getDefaultPeriodCount(
  duration: Duration,
  overrides?: PeriodCountOverrides
): number {
  const overrideOptions = overrides?.[duration]
  if (overrideOptions) {
    return overrideOptions[0]
  }
  return DEFAULT_PERIOD_COUNTS[duration]
}

/**
 * Get the label for the period count selector based on duration
 * e.g., "Last Days", "Last Weeks", "Last Months"
 */
export function getPeriodCountLabel(duration: Duration): string {
  const unit = PERIOD_UNIT_LABELS[duration]
  return `Last ${unit.plural}`
}

/**
 * Format period count value for display
 * Returns "All" for unlimited, or the number with appropriate unit
 */
export function formatPeriodCountValue(
  count: number | 'all',
  duration: Duration
): string {
  if (count === 'all') {
    return 'All'
  }

  const unit = PERIOD_UNIT_LABELS[duration]
  const unitLabel = count === 1 ? unit.singular : unit.plural
  return `${count} ${unitLabel}`
}

const MIN_PERIOD_COUNT = 1
const MAX_PERIOD_COUNT = 50

/**
 * Clamp a period count value to valid bounds [1, 50].
 * Passes through 'all' unchanged.
 */
export function clampPeriodCount(count: number | 'all'): number | 'all' {
  if (count === 'all') {
    return 'all'
  }
  return Math.max(MIN_PERIOD_COUNT, Math.min(MAX_PERIOD_COUNT, count))
}

/**
 * Narrow a period count filter to a numeric value.
 * Use when 'all' is not a valid option (e.g., table-based layouts with showAllOption={false}).
 * Returns the default period count for the given duration if the value is 'all'.
 */
export function asNumericPeriodCount(
  count: number | 'all',
  duration: Duration,
  overrides?: PeriodCountOverrides
): number {
  if (count === 'all') {
    return getDefaultPeriodCount(duration, overrides)
  }
  return count
}

/**
 * Validate and adjust period count when duration changes
 * Returns closest valid option if current selection is invalid
 */
export function adjustPeriodCountForDuration(
  currentCount: number | 'all',
  newDuration: Duration,
  overrides?: PeriodCountOverrides
): number | 'all' {
  if (currentCount === 'all') {
    return 'all'
  }

  const options = getPeriodCountOptions(newDuration, overrides)

  // If current count is a valid option, keep it
  if (options.includes(currentCount)) {
    return currentCount
  }

  // Find the closest option
  let closest = options[0]
  let minDiff = Math.abs(currentCount - closest)

  for (const option of options) {
    const diff = Math.abs(currentCount - option)
    if (diff < minDiff) {
      minDiff = diff
      closest = option
    }
  }

  return closest
}
