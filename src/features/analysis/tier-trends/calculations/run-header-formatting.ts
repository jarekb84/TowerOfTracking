import type { ParsedGameRun } from '@/shared/types/game-run.types'

// Re-export shared formatters for backward compatibility
// These functions have been moved to shared/formatting for cross-feature use


import {
  formatTierWaveHeader,
  formatDurationHoursMinutes,
  formatTimestampDisplay,
} from '@/shared/formatting/run-display-formatters'

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

