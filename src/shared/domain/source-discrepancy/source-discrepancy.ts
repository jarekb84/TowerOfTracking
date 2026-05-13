import {
  DISCREPANCY_THRESHOLD,
  type DiscrepancyType,
} from './source-discrepancy-config';

interface DiscrepancyResult {
  type: DiscrepancyType;
  value: number;
  percentage: number;
}

/**
 * Calculates discrepancy between a total and the sum of its sources.
 *
 * - Returns `'unknown'` when sources sum to less than total (missing data).
 * - Returns `'overage'` when sources exceed total (excess data).
 * - Returns null when within the threshold (default 1%) or exactly matching.
 */
export function calculateDiscrepancy(
  total: number,
  sourceSum: number,
  threshold: number = DISCREPANCY_THRESHOLD,
): DiscrepancyResult | null {
  if (total === 0) {
    if (sourceSum > 0) {
      return { type: 'overage', value: sourceSum, percentage: 100 };
    }
    return null;
  }

  const difference = total - sourceSum;
  if (difference === 0) return null;

  const percentageDecimal = Math.abs(difference) / total;
  if (percentageDecimal <= threshold) return null;

  const percentage = Math.round(percentageDecimal * 10000) / 100;

  if (difference > 0) {
    return { type: 'unknown', value: difference, percentage };
  }
  return { type: 'overage', value: Math.abs(difference), percentage };
}
