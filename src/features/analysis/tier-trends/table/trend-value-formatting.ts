import { TrendsAggregation } from '../types';
import { formatLargeNumber } from '@/shared/formatting/number-scale';

/**
 * Format a trend value with appropriate suffix based on aggregation type.
 * Uses locale-aware formatting from the locale store.
 *
 * @param value - The numeric value to format
 * @param aggregationType - The aggregation type being used
 * @returns Formatted string with "/h" suffix for hourly rates
 *
 * @example
 * formatTrendValue(1350000, TrendsAggregation.HOURLY); // "1.35M/h" or "1,35M/h"
 * formatTrendValue(1350000, TrendsAggregation.SUM); // "1.35M" or "1,35M"
 * formatTrendValue(0, TrendsAggregation.HOURLY); // "0/h"
 */
export function formatTrendValue(
  value: number,
  aggregationType?: TrendsAggregation
): string {
  const formattedNumber = formatLargeNumber(value);

  if (aggregationType === TrendsAggregation.HOURLY) {
    return `${formattedNumber}/h`;
  }

  return formattedNumber;
}
