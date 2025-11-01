import type { ParsedGameRun } from '@/features/data-tracking/types/game-run.types'

// ============================================================================
// Main Header Creation Functions
// ============================================================================

/**
 * Creates enhanced 3-line column header for per-run analysis
 * Returns an object with header and subHeader for ComparisonColumn
 */
export function createEnhancedRunHeader(
  run: ParsedGameRun
): { header: string; subHeader?: string } {
  // Line 1: Tier and Wave (primary identifier)
  const primaryLine = formatTierWaveHeader(run.tier, run.wave)
  
  // Line 2: Duration
  const durationLine = formatDurationHoursMinutes(run.realTime)
  
  // Line 3: Date/Time
  const dateTimeLine = formatTimestampDisplay(run.timestamp)
  
  // Combine into multi-line format
  // Using newlines to create the 3-line structure
  const multiLineHeader = `${primaryLine}\n${durationLine}\n${dateTimeLine}`
  
  return {
    header: multiLineHeader
  }
}

// ============================================================================
// Formatting Helper Functions
// ============================================================================

/**
 * Formats tier and wave for primary header line
 * Example: tier=10, wave=6008 -> "T10 6,008"
 */
export function formatTierWaveHeader(tier: number, wave: number): string {
  return `T${tier} ${formatWaveNumber(wave)}`
}

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

/**
 * Formats a timestamp to a date/time string for display
 * Example: Date(2024-08-17T15:45:00Z) -> "8/17 3:45 PM"
 */
export function formatTimestampDisplay(timestamp: Date): string {
  const date = timestamp.toLocaleDateString('en-US', { 
    month: 'numeric', 
    day: 'numeric' 
  })
  const time = timestamp.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  return `${date} ${time}`
}

/**
 * Formats wave number with thousands separator
 * Example: 6008 -> "6,008"
 */
export function formatWaveNumber(wave: number): string {
  return wave.toLocaleString()
}