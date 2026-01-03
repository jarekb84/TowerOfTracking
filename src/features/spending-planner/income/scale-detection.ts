/**
 * Scale Detection Utilities
 *
 * Pure functions for detecting the best scale suffix for currency values.
 */

import { SCALE_OPTIONS } from './scale-options'

/**
 * Determine the best scale suffix for a given numeric value.
 * Finds the largest scale that produces a clean display value (1-9999 range).
 *
 * @param value - The numeric value to analyze
 * @returns The scale suffix (e.g., 'K', 'M', 'T') or '' for small values
 */
export function getBestScaleForValue(value: number): string {
  if (value === 0) {
    return ''
  }

  // Sort scales from largest to smallest (excluding the empty scale)
  const sortedScales = [...SCALE_OPTIONS]
    .filter((s) => s.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier)

  for (const scale of sortedScales) {
    const displayValue = value / scale.multiplier
    // Use this scale if the result is in a reasonable display range
    if (displayValue >= 1 && displayValue < 10000) {
      // Check if it produces a clean number (at most 2 decimal places)
      const rounded = Math.round(displayValue * 100) / 100
      if (Math.abs(rounded - displayValue) < 0.001) {
        return scale.value
      }
    }
  }

  // Fall back to no scale for small or unusual values
  return ''
}
