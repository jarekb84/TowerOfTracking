/**
 * Run Display Formatters
 *
 * Pure formatting functions for displaying game run information consistently
 * across the application. Used by chart tooltips, table headers, and run details.
 *
 * These functions handle display formatting for:
 * - Tier/wave combinations
 * - Duration (hours/minutes)
 * - Timestamps
 * - Wave numbers with locale formatting
 */

import { formatDisplayShortDateTime } from './date-formatters'

// ============================================================================
// Tier and Wave Formatting
// ============================================================================

/**
 * Formats tier and wave for display headers
 * Example: tier=10, wave=6008 -> "T10 6,008"
 */
export function formatTierWaveHeader(tier: number, wave: number): string {
  return `T${tier} ${formatWaveNumber(wave)}`
}

/**
 * Formats wave number with thousands separator
 * Example: 6008 -> "6,008"
 */
export function formatWaveNumber(wave: number): string {
  return wave.toLocaleString()
}

// ============================================================================
// Duration Formatting
// ============================================================================

/**
 * Formats duration in seconds to hours and minutes display format
 * Example: 31415 seconds -> "8hr 43min"
 */
export function formatDurationHoursMinutes(durationSeconds: number): string {
  const totalMinutes = Math.floor(durationSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}min`
  }

  return `${hours}hr ${minutes}min`
}

// ============================================================================
// Timestamp Formatting
// ============================================================================

/**
 * Formats a timestamp to a date/time string for display
 * Uses user's locale setting for format (e.g., "8/17 3:45 PM" or "17/8 15:45")
 */
export function formatTimestampDisplay(timestamp: Date): string {
  return formatDisplayShortDateTime(timestamp)
}

// ============================================================================
// Game Speed Formatting
// ============================================================================

/**
 * Format game speed with 'x' suffix.
 * Removes unnecessary trailing zeros for cleaner display.
 * Examples: 2.0 -> "2x", 2.5 -> "2.5x", 2.123 -> "2.123x"
 * Game speed is the ratio of gameTime to realTime.
 */
export function formatGameSpeed(value: number): string {
  // Use up to 3 decimal places, trimming trailing zeros and decimal point
  const formatted = value.toFixed(3).replace(/\.?0+$/, '')
  return formatted + 'x'
}
