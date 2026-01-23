/**
 * Timeline Layout Utilities
 *
 * Pure functions for formatting timeline layout data.
 *
 * ARCHITECTURAL NOTE:
 * -------------------
 * As of the architectural refactoring, balance calculations are now handled entirely
 * by the timeline calculator (timeline-calculator.ts). The display layer receives
 * pre-computed values via TimelineData.weekDisplayData and renders them directly.
 *
 * This file now contains only display formatting utilities.
 * Functions removed during refactoring:
 * - calculatePriorBalances() - now computed by timeline-calculator
 * - getWeekCurrencyData() - replaced by weekDisplayData
 * - applyIncomeProration() - proration now applied in calculator
 * - calculateWeekBalance() - replaced by weekDisplayData
 */

/**
 * Format a metric value for display based on design decisions:
 * - Zero income: Leave blank (empty string)
 * - No spending: Show '-'
 * - Non-zero values: Format normally (caller handles formatting)
 *
 * @param value - The numeric value
 * @param type - 'income' or 'expenditure' to determine display rules
 * @returns Object with displayValue (formatted or special) and hasValue boolean
 */
export function formatMetricDisplay(
  value: number,
  type: 'income' | 'expenditure'
): { displayValue: string; hasValue: boolean } {
  if (value === 0) {
    if (type === 'income') {
      // Zero income: leave blank
      return { displayValue: '', hasValue: false }
    } else {
      // No spending: show dash
      return { displayValue: '-', hasValue: false }
    }
  }

  // Non-zero value - caller will format the number
  return { displayValue: '', hasValue: true }
}
