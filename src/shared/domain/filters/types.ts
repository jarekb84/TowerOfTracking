/**
 * Unified Filter Component Types
 *
 * Shared type definitions for filter components used across analysis pages.
 * These provide consistent behavior for duration, tier, and period filtering.
 */

/**
 * Unified duration options for all analysis features
 * Replaces separate TrendsDuration and SourceDuration enums
 */
export enum Duration {
  PER_RUN = 'per-run',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * Tier filter value - either a specific tier number or 'all' for aggregate
 */
export type TierFilter = number | 'all'

/**
 * Period count filter value - either a specific count or 'all' for no limit
 */
export type PeriodCountFilter = number | 'all'

/**
 * Display labels for duration options
 */
export const DURATION_LABELS: Record<Duration, string> = {
  [Duration.PER_RUN]: 'Per Run',
  [Duration.DAILY]: 'Daily',
  [Duration.WEEKLY]: 'Weekly',
  [Duration.MONTHLY]: 'Monthly',
  [Duration.YEARLY]: 'Yearly'
}

/**
 * Unit labels for period count selector (singular/plural)
 */
interface PeriodUnitLabels {
  singular: string
  plural: string
}

export const PERIOD_UNIT_LABELS: Record<Duration, PeriodUnitLabels> = {
  [Duration.PER_RUN]: { singular: 'Run', plural: 'Runs' },
  [Duration.DAILY]: { singular: 'Day', plural: 'Days' },
  [Duration.WEEKLY]: { singular: 'Week', plural: 'Weeks' },
  [Duration.MONTHLY]: { singular: 'Month', plural: 'Months' },
  [Duration.YEARLY]: { singular: 'Year', plural: 'Years' }
}
