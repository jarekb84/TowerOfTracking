/**
 * Pure display functions for percentage change values.
 * Extracted for testability and reuse.
 */

/** Color class names for percentage change values */
type PercentChangeColorClass = 'text-green-400' | 'text-red-400' | 'text-slate-400'

/**
 * Get CSS color class for percentage change value.
 * Positive = green, negative = red, zero = neutral gray.
 */
export function getPercentChangeColorClass(value: number): PercentChangeColorClass {
  if (value > 0) return 'text-green-400'
  if (value < 0) return 'text-red-400'
  return 'text-slate-400'
}

/**
 * Format percentage change with sign prefix.
 * Positive values get a "+" prefix, negative use their natural "-".
 */
export function formatPercentChangeDisplay(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}
