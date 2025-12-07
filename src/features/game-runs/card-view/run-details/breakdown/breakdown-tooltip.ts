/**
 * Breakdown Tooltip Utilities
 *
 * Pure functions for building tooltip text for breakdown items.
 */

import type { DiscrepancyType } from '@/shared/domain/fields/breakdown-sources'

/**
 * Build explanatory tooltip text for discrepancy entries.
 *
 * @param type - 'unknown' (missing data) or 'overage' (excess data)
 * @param percentage - The discrepancy percentage (0-100)
 * @param displayValue - Formatted discrepancy value (e.g., "9K")
 * @returns Human-readable tooltip explaining the discrepancy
 */
export function buildDiscrepancyTooltip(
  type: DiscrepancyType,
  percentage: number,
  displayValue: string
): string {
  const accountedPercentage = (100 - percentage).toFixed(1)
  const excessPercentage = (100 + percentage).toFixed(1)

  if (type === 'unknown') {
    return `Missing sources: Listed sources account for ${accountedPercentage}% of total. ${displayValue} (${percentage}%) is unaccounted for.`
  }

  return `Data inconsistency: Listed sources sum to ${excessPercentage}% of the reported total. This may indicate a game export bug.`
}
