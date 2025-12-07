/**
 * Discrepancy Detection Configuration
 *
 * Constants and types for detecting and displaying discrepancies
 * between source breakdowns and their totals in Run Details and
 * Source Analysis views.
 */

/**
 * Minimum percentage difference to show a discrepancy entry.
 * Discrepancies at or below this threshold are ignored to filter
 * out floating-point noise.
 *
 * Value: 1% (0.01)
 */
export const DISCREPANCY_THRESHOLD = 0.01;

/**
 * Colors for discrepancy visualization.
 * - unknown: Gray for missing/unaccounted data (informational)
 * - overage: Amber for excess data (warning, may indicate bug)
 */
export const DISCREPANCY_COLORS = {
  unknown: '#6b7280', // gray-600
  overage: '#fbbf24', // amber-400
} as const;

/**
 * Type of discrepancy detected between source sum and total.
 * - 'unknown': Total > source sum (missing data)
 * - 'overage': Source sum > total (excess data)
 * - null: No significant discrepancy
 */
export type DiscrepancyType = 'unknown' | 'overage';

/**
 * Field names used for discrepancy entries.
 * Prefixed with underscore to distinguish from real fields.
 */
export const DISCREPANCY_FIELD_NAMES = {
  unknown: '_unknown',
  overage: '_overage',
} as const;

/**
 * Display names shown to users for discrepancy entries.
 */
export const DISCREPANCY_DISPLAY_NAMES = {
  unknown: 'Unknown',
  overage: 'Overage',
} as const;
