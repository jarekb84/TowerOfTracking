/**
 * Discrepancy Calculation Utilities
 *
 * Pure functions for detecting and calculating discrepancies
 * between source breakdowns and their totals.
 */

import {
  DISCREPANCY_THRESHOLD,
  type DiscrepancyType,
} from './discrepancy-config';

/**
 * Result of discrepancy calculation.
 */
interface DiscrepancyResult {
  /** Type of discrepancy: 'unknown' for missing data, 'overage' for excess */
  type: DiscrepancyType;
  /** Absolute value of the discrepancy */
  value: number;
  /** Percentage of total that the discrepancy represents (0-100) */
  percentage: number;
}

/**
 * Calculates discrepancy between a total and the sum of its sources.
 *
 * @param total - The stated total value
 * @param sourceSum - The sum of all source values
 * @param threshold - Minimum percentage to report (default: 1%)
 * @returns Discrepancy result if significant, null otherwise
 *
 * @example
 * // Unknown: sources don't fully explain total
 * calculateDiscrepancy(1000, 900) // { type: 'unknown', value: 100, percentage: 10 }
 *
 * // Overage: sources exceed total
 * calculateDiscrepancy(1000, 1100) // { type: 'overage', value: 100, percentage: 10 }
 *
 * // Below threshold: no discrepancy shown
 * calculateDiscrepancy(1000, 995) // null (0.5% < 1% threshold)
 */
export function calculateDiscrepancy(
  total: number,
  sourceSum: number,
  threshold: number = DISCREPANCY_THRESHOLD
): DiscrepancyResult | null {
  // Handle zero total edge case
  if (total === 0) {
    if (sourceSum > 0) {
      // Sources exist but total is zero - 100% overage
      return {
        type: 'overage',
        value: sourceSum,
        percentage: 100,
      };
    }
    // Both zero - no discrepancy
    return null;
  }

  const difference = total - sourceSum;

  // No difference at all
  if (difference === 0) {
    return null;
  }

  // Calculate percentage relative to total
  const percentageDecimal = Math.abs(difference) / total;

  // Only report if strictly greater than threshold
  if (percentageDecimal <= threshold) {
    return null;
  }

  // Convert to display percentage (0-100) with 2 decimal precision
  const percentage = Math.round(percentageDecimal * 10000) / 100;

  if (difference > 0) {
    // Total > sourceSum: missing/unknown sources
    return {
      type: 'unknown',
      value: difference,
      percentage,
    };
  } else {
    // sourceSum > total: overage/excess
    return {
      type: 'overage',
      value: Math.abs(difference),
      percentage,
    };
  }
}
