/**
 * Event Form Utilities
 *
 * Pure functions for event form value conversion.
 */

import { SCALE_OPTIONS } from './add-event-form'

interface DisplayValueAndScale {
  value: string
  scale: string
}

/**
 * Convert a raw amount to a display value and scale suffix.
 * Finds the largest scale that produces a clean value (no decimals when possible).
 */
export function getDisplayValueAndScale(amount: number): DisplayValueAndScale {
  if (amount === 0) {
    return { value: '0', scale: '' }
  }

  // Sort scales from largest to smallest (excluding the empty scale)
  const sortedScales = [...SCALE_OPTIONS]
    .filter((s) => s.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier)

  for (const scale of sortedScales) {
    const value = amount / scale.multiplier
    // Use this scale if the result is >= 1 and reasonably clean
    if (value >= 1 && value < 10000) {
      // Check if it's a clean number (at most 2 decimal places)
      const rounded = Math.round(value * 100) / 100
      if (Math.abs(rounded - value) < 0.001) {
        return {
          value: rounded.toString(),
          scale: scale.value,
        }
      }
    }
  }

  // Fall back to raw value with no scale
  return { value: amount.toString(), scale: '' }
}

/**
 * Calculate the final amount from form values.
 */
export function calculateFinalAmount(
  amountValue: string,
  amountScale: string,
  hasUnitSelector: boolean
): number {
  const baseAmount = parseFloat(amountValue) || 0
  const multiplier = SCALE_OPTIONS.find((s) => s.value === amountScale)?.multiplier || 1
  return hasUnitSelector ? baseAmount * multiplier : baseAmount
}

/**
 * Parse duration days from form input.
 * Returns undefined for empty, zero, or invalid values.
 */
export function parseDurationDays(value: string): number | undefined {
  if (!value) return undefined
  const parsed = parseInt(value, 10)
  return parsed > 0 ? parsed : undefined
}
