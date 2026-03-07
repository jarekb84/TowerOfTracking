/**
 * Period Count Fallback Hook
 *
 * Auto-corrects the selected period count when data-aware pruning
 * removes the currently selected option from the available list.
 *
 * Encapsulates the repeated pattern of "watch options, fall back if invalid"
 * used across source-analysis, coverage-report, and tier-trends.
 */

import { useEffect } from 'react'
import type { PeriodCountFilter } from '../types'
import { fallbackToValidOption, type FallbackStrategy } from './period-count-logic'

/**
 * Auto-fallback hook for period count selection.
 *
 * When available options change and the current selection is no longer valid,
 * calls onFallback with a valid replacement.
 *
 * @param strategy - 'all' (default) falls back to 'all'; 'last-available' falls
 *   back to the highest numeric option (for number-only consumers like tier-trends).
 */
export function usePeriodCountFallback(
  currentCount: PeriodCountFilter,
  availableOptions: number[],
  onFallback: (count: PeriodCountFilter) => void,
  strategy: FallbackStrategy = 'all'
): void {
  useEffect(() => {
    const validCount = fallbackToValidOption(currentCount, availableOptions, strategy)
    if (validCount !== currentCount) {
      onFallback(validCount)
    }
  }, [availableOptions]) // intentionally omit currentCount to avoid re-triggering on every change
}
