/**
 * Per-field percentile calculation that tracks source data
 * Used for tier statistics where each field needs its own percentile calculation
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'

interface FieldPercentileResult {
  value: number
  sourceRun: ParsedGameRun
  duration: number
}

interface FieldPercentilesResult {
  p99: FieldPercentileResult | null
  p90: FieldPercentileResult | null
  p75: FieldPercentileResult | null
  p50: FieldPercentileResult | null
}

/**
 * Calculate percentiles for a specific field across runs
 * Returns percentile values along with their corresponding run data
 *
 * @param runs - Array of runs to analyze
 * @param getValue - Function to extract the field value from a run
 * @returns Percentile results with source run information
 */
export function calculateFieldPercentiles(
  runs: ParsedGameRun[],
  getValue: (run: ParsedGameRun) => number | null
): FieldPercentilesResult {
  // Filter runs that have valid values for this field
  const validRuns = runs
    .map(run => ({
      run,
      value: getValue(run),
      duration: run.realTime
    }))
    .filter(item => item.value !== null) as Array<{
      run: ParsedGameRun
      value: number
      duration: number
    }>

  if (validRuns.length === 0) {
    return {
      p99: null,
      p90: null,
      p75: null,
      p50: null
    }
  }

  // Sort by value (ascending)
  const sorted = [...validRuns].sort((a, b) => a.value - b.value)

  return {
    p99: getPercentileAtPosition(sorted, 0.99),
    p90: getPercentileAtPosition(sorted, 0.90),
    p75: getPercentileAtPosition(sorted, 0.75),
    p50: getPercentileAtPosition(sorted, 0.50)
  }
}

/**
 * Get the run data at a specific percentile position
 */
function getPercentileAtPosition(
  sortedRuns: Array<{ run: ParsedGameRun; value: number; duration: number }>,
  percentile: number
): FieldPercentileResult | null {
  if (sortedRuns.length === 0) {
    return null
  }

  if (sortedRuns.length === 1) {
    return {
      value: sortedRuns[0].value,
      sourceRun: sortedRuns[0].run,
      duration: sortedRuns[0].duration
    }
  }

  const index = Math.floor(percentile * sortedRuns.length)
  const clampedIndex = Math.min(index, sortedRuns.length - 1)
  const item = sortedRuns[clampedIndex]

  return {
    value: item.value,
    sourceRun: item.run,
    duration: item.duration
  }
}
