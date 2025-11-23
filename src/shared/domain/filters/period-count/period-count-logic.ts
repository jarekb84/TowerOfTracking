/**
 * Period Count Logic
 *
 * Pure functions for generating period count options based on duration.
 */

import { Duration, PERIOD_UNIT_LABELS } from '../types'

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
  [Duration.PER_RUN]: 10,
  [Duration.DAILY]: 14,
  [Duration.WEEKLY]: 10,
  [Duration.MONTHLY]: 6,
  [Duration.YEARLY]: 3
}

/**
 * Get period count options for a given duration
 */
export function getPeriodCountOptions(duration: Duration): number[] {
  return PERIOD_COUNT_OPTIONS[duration]
}

/**
 * Get the default period count for a duration
 */
export function getDefaultPeriodCount(duration: Duration): number {
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

/**
 * Validate and adjust period count when duration changes
 * Returns closest valid option if current selection is invalid
 */
export function adjustPeriodCountForDuration(
  currentCount: number | 'all',
  newDuration: Duration
): number | 'all' {
  if (currentCount === 'all') {
    return 'all'
  }

  const options = getPeriodCountOptions(newDuration)

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
