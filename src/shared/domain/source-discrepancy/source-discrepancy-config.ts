/**
 * Source Discrepancy Configuration
 *
 * Constants and types for detecting and displaying discrepancies between
 * source breakdowns and their totals. Used by run-details and source-analysis
 * to flag missing or excess source data on breakdown charts.
 */

export const DISCREPANCY_THRESHOLD = 0.01;

export const DISCREPANCY_COLORS = {
  unknown: '#6b7280', // gray-600
  overage: '#fbbf24', // amber-400
} as const;

export type DiscrepancyType = 'unknown' | 'overage';

// Prefixed with underscore so they can't collide with real field ids.
export const DISCREPANCY_FIELD_NAMES = {
  unknown: '_unknown',
  overage: '_overage',
} as const;

export const DISCREPANCY_DISPLAY_NAMES = {
  unknown: 'Unknown',
  overage: 'Overage',
} as const;
